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
