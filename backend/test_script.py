from fastapi.testclient import TestClient
from main import app
import sys

client = TestClient(app)

def run_tests():
    print("1. Testing Register...")
    res = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "nickname": "testuser",
        "location": "역삼동"
    })
    print("Register response:", res.status_code, res.text)
    
    print("\n2. Testing Login...")
    res = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    print("Login response:", res.status_code, res.text)
    if res.status_code != 200:
        print("Login failed, aborting further tests.")
        sys.exit(1)
        
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("\n3. Testing Get Me...")
    res = client.get("/api/users/me", headers=headers)
    print("Get Me response:", res.status_code, res.text)

    print("\n4. Testing Create Item...")
    # create_item uses Form data
    res = client.post("/api/items", headers=headers, data={
        "title": "Test Buleum",
        "price": 10000,
        "description": "Test Description",
        "location": "강남역"
    })
    print("Create Item response:", res.status_code, res.text)
    
    print("\n5. Testing Get Items...")
    res = client.get("/api/items")
    print("Get Items response:", res.status_code, res.text)

if __name__ == "__main__":
    run_tests()
