from typing import cast

from server.utils.api_definitions import (
    infer_schema_from_response_example,
    openapi_to_make_schema,
)


def test_infer_schema_types():
    example = {
        'id': 123,
        'name': 'Alice',
        'active': True,
        'float': 1.23,
        'items': [],
        'dict': {},
    }
    schema = infer_schema_from_response_example(example)
    assert schema.get('type') == 'object'
    assert schema.get('properties', {}).get('id').get('type') == 'number'
    assert schema.get('properties', {}).get('name').get('type') == 'string'
    assert schema.get('properties', {}).get('active').get('type') == 'boolean'
    assert schema.get('properties', {}).get('items').get('type') == 'array'
    assert schema.get('properties', {}).get('dict').get('type') == 'object'


def test_infer_schema_nested_objects():
    example = {
        'shallow_value': 123,
        'nested_value': {
            'id': 123,
            'name': 'Alice',
            'active': True,
            'float': 1.23,
            'items': [],
            'dict': {},
        },
    }
    schema = infer_schema_from_response_example(example)
    assert schema.get('type') == 'object'
    assert schema.get('properties', {}).get('shallow_value').get('type') == 'number'
    assert schema.get('properties', {}).get('nested_value').get('type') == 'object'
    assert (
        schema.get('properties', {})
        .get('nested_value')
        .get('properties', {})
        .get('id')
        .get('type')
        == 'number'
    )
    assert (
        schema.get('properties', {})
        .get('nested_value')
        .get('properties', {})
        .get('name')
        .get('type')
        == 'string'
    )
    assert (
        schema.get('properties', {})
        .get('nested_value')
        .get('properties', {})
        .get('active')
        .get('type')
        == 'boolean'
    )
    assert (
        schema.get('properties', {})
        .get('nested_value')
        .get('properties', {})
        .get('items')
        .get('type')
        == 'array'
    )
    assert (
        schema.get('properties', {})
        .get('nested_value')
        .get('properties', {})
        .get('dict')
        .get('type')
        == 'object'
    )


def test_infer_schema_from_response_example_duplicate_array_items():
    """Test schema inference for arrays with duplicate item types."""
    example = {
        'homogeneous_array': [1, 2, 3],
        'heterogeneous_array': [1, 'string', True],
        'duplicate_types_array': [1, 2, 'string', 'another_string', 3],
    }
    schema = infer_schema_from_response_example(example)

    # Homogeneous array should have single item type
    homogeneous_items = (
        schema.get('properties', {}).get('homogeneous_array', {}).get('items', {})
    )
    assert homogeneous_items.get('type') == 'number'

    # Heterogeneous array should use anyOf
    heterogeneous_items = (
        schema.get('properties', {}).get('heterogeneous_array', {}).get('items', {})
    )
    assert 'anyOf' in heterogeneous_items
    any_of_types = [item.get('type') for item in heterogeneous_items.get('anyOf', [])]
    assert 'number' in any_of_types
    assert 'string' in any_of_types
    assert 'boolean' in any_of_types

    # Array with duplicate types should deduplicate in anyOf
    duplicate_items = (
        schema.get('properties', {}).get('duplicate_types_array', {}).get('items', {})
    )
    assert 'anyOf' in duplicate_items
    any_of_schemas = duplicate_items.get('anyOf', [])
    # Should only have 2 unique schemas: number and string
    assert len(any_of_schemas) == 2
    any_of_types = [item.get('type') for item in any_of_schemas]
    assert 'number' in any_of_types
    assert 'string' in any_of_types


def test_infer_schema_from_response_example_nested_objects_in_arrays():
    # Test nested objects in arrays
    nested_example = {
        'array_with_nested_objects': [
            {'id': 1, 'name': 'first'},
            {'id': 2, 'number': 0},
            'string_item',
        ]
    }
    nested_schema = infer_schema_from_response_example(nested_example)

    nested_array_items = (
        nested_schema.get('properties', {})
        .get('array_with_nested_objects', {})
        .get('items', {})
    )
    assert 'anyOf' in nested_array_items
    any_of_schemas = nested_array_items.get('anyOf', [])
    assert len(any_of_schemas) == 3

    # Should have object type and string type
    types = [item.get('type') for item in any_of_schemas]
    assert 'object' in types
    assert 'string' in types

    # Should have two different object schemas
    object_schemas = [item for item in any_of_schemas if item.get('type') == 'object']
    assert len(object_schemas) == 2

    # Check each object schema individually
    obj1_properties = object_schemas[0].get('properties', {})
    obj2_properties = object_schemas[1].get('properties', {})

    # First object should have 'id' and 'name'
    assert obj1_properties.get('id', {}).get('type') == 'number'
    assert obj1_properties.get('name', {}).get('type') == 'string'

    # Second object should have 'id' and 'number'
    assert obj2_properties.get('id', {}).get('type') == 'number'
    assert obj2_properties.get('number', {}).get('type') == 'number'


def test_openapi_to_make_schema():
    openapi_schema = {
        'type': 'object',
        'properties': {
            'integer': {'type': 'number'},
            'boolean': {'type': 'boolean'},
            'array': {'type': 'array', 'items': {'type': 'number'}},
            'object': {
                'type': 'object',
                'properties': {'id': {'type': 'number'}, 'name': {'type': 'string'}},
            },
            'text_fallback': {'type': 'notAType'},
        },
    }
    make_schema = openapi_to_make_schema(openapi_schema)
    schema_list = cast(list[dict], make_schema)
    print(schema_list)
    assert len(schema_list) == 5
    assert schema_list[0].get('name') == 'integer'
    assert schema_list[0].get('type') == 'number'
    assert schema_list[1].get('name') == 'boolean'
    assert schema_list[1].get('type') == 'boolean'
    assert schema_list[2].get('name') == 'array'
    assert schema_list[2].get('type') == 'array'
    # Check spec for array (items: integer -> number)
    assert 'spec' in schema_list[2]
    assert schema_list[2].get('spec', {}).get('type') == 'number'

    # Object should map to collection with nested spec
    assert schema_list[3].get('name') == 'object'
    assert schema_list[3].get('type') == 'collection'
    nested_spec = schema_list[3].get('spec')
    assert isinstance(nested_spec, list)
    assert len(nested_spec) == 2
    assert nested_spec[0].get('name') == 'id'
    assert nested_spec[0].get('type') == 'number'
    assert nested_spec[1].get('name') == 'name'
    assert nested_spec[1].get('type') == 'text'

    assert schema_list[4].get('name') == 'text_fallback'
    assert schema_list[4].get('type') == 'text'


def test_openapi_to_make_schema_items_anyof_under_items():
    """Arrays with items.anyOf should map item spec type from the first anyOf item."""
    openapi_schema = {
        'type': 'object',
        'properties': {
            'array_items_any_of': {
                'type': 'array',
                'items': {
                    'anyOf': [
                        {'type': 'number'},
                        {'type': 'string'},
                    ]
                },
            }
        },
    }
    make_schema = openapi_to_make_schema(openapi_schema)
    schema_list = cast(list[dict], make_schema)
    entry = next(
        item for item in schema_list if item.get('name') == 'array_items_any_of'
    )
    assert entry.get('type') == 'array'
    # Expect first anyOf item (integer) -> number
    assert entry.get('spec', {}).get('type') == 'number'


def test_openapi_to_make_schema_array_of_objects_includes_nested_spec():
    """Arrays of objects should use collection item type with nested spec retained."""
    openapi_schema = {
        'type': 'object',
        'properties': {
            'array_of_objects': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'number'},
                        'name': {'type': 'string'},
                    },
                },
            }
        },
    }
    make_schema = openapi_to_make_schema(openapi_schema)
    schema_list = cast(list[dict], make_schema)
    entry = next(item for item in schema_list if item.get('name') == 'array_of_objects')
    assert entry.get('type') == 'array'
    # Item spec should be a collection with nested spec list
    item_spec = entry.get('spec')
    assert isinstance(item_spec, dict)
    assert item_spec.get('type') == 'collection'
    nested_spec = item_spec.get('spec')
    assert isinstance(nested_spec, list)
    # Validate nested fields
    nested_by_name = {f.get('name'): f for f in nested_spec}
    assert nested_by_name.get('id', {}).get('type') == 'number'
    assert nested_by_name.get('name', {}).get('type') == 'text'
