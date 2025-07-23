from fastapi.testclient import TestClient

from .server import app

client = TestClient(app)


def test_main():
    response = client.get('/', headers={'X-API-Key': 'not-secure-api-key'})
    assert response.status_code == 200
    assert response.json() == {'msg': 'Hello World'}
