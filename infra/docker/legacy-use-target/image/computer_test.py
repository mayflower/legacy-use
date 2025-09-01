from computer import chunks


def test_chunks():
    assert chunks('Hello, world!', 5) == ['Hello', ', wor', 'ld!']
    assert chunks('Hello, world!', 10) == ['Hello, wor', 'ld!']
    assert chunks('Hello, world!', 100) == ['Hello, world!']
