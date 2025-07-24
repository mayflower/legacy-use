from fastapi import HTTPException
from fastapi.testclient import TestClient
import pytest

from .server import app

client = TestClient(app)


def test_main_no_api_key():
    with pytest.raises(HTTPException):
        response = client.get('/')

        assert response.status_code == 401
        assert response.text == 'API key is missing'


def test_main():
    response = client.get('/', headers={'X-API-Key': 'your_api_key_here'})
    assert response.status_code == 200
