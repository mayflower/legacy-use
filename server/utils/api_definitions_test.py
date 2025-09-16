from server.utils.api_definitions import infer_schema_from_response_example


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
    assert schema.get('properties', {}).get('id').get('type') == 'integer'
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
    assert schema.get('properties', {}).get('shallow_value').get('type') == 'integer'
    assert schema.get('properties', {}).get('nested_value').get('type') == 'object'
    assert (
        schema.get('properties', {})
        .get('nested_value')
        .get('properties', {})
        .get('id')
        .get('type')
        == 'integer'
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
    assert homogeneous_items.get('type') == 'integer'

    # Heterogeneous array should use anyOf
    heterogeneous_items = (
        schema.get('properties', {}).get('heterogeneous_array', {}).get('items', {})
    )
    assert 'anyOf' in heterogeneous_items
    any_of_types = [item.get('type') for item in heterogeneous_items.get('anyOf', [])]
    assert 'integer' in any_of_types
    assert 'string' in any_of_types
    assert 'boolean' in any_of_types

    # Array with duplicate types should deduplicate in anyOf
    duplicate_items = (
        schema.get('properties', {}).get('duplicate_types_array', {}).get('items', {})
    )
    assert 'anyOf' in duplicate_items
    any_of_schemas = duplicate_items.get('anyOf', [])
    # Should only have 2 unique schemas: integer and string
    assert len(any_of_schemas) == 2
    any_of_types = [item.get('type') for item in any_of_schemas]
    assert 'integer' in any_of_types
    assert 'string' in any_of_types
