"""Integration tests for the API endpoints."""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import os

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_kisan.db"

from backend.main import app


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


from backend.database import init_db

@pytest_asyncio.fixture(scope="module")
async def client():
    # Remove old test DB if exists
    if os.path.exists("./test_kisan.db"):
        os.remove("./test_kisan.db")
        
    await init_db()
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
        
    # Cleanup after tests
    if os.path.exists("./test_kisan.db"):
        os.remove("./test_kisan.db")


@pytest.mark.anyio
async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.anyio
async def test_register_and_login(client):
    # Register
    resp = await client.post("/api/v1/register", json={"username": "testuser", "password": "testpass123"})
    assert resp.status_code == 200

    # Login
    resp = await client.post(
        "/api/v1/token",
        data={"username": "testuser", "password": "testpass123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data


@pytest.mark.anyio
async def test_protected_route_requires_auth(client):
    resp = await client.get("/api/v1/cases")
    assert resp.status_code == 401
