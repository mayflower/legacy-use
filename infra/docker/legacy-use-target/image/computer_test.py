from computer import chunks


def test_chunks():
    assert chunks('Hello, world!', 5) == ['Hello', ', wor', 'ld!']
    assert chunks('Hello, world!', 10) == ['Hello, wor', 'ld!']
    assert chunks('Hello, world!', 100) == ['Hello, world!']


def test_chunks_newline():
    assert chunks('1\n2', 100) == ['1', '2']
