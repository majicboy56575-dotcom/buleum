from fastapi.testclient import TestClient
from main import app
import io
import sys

client = TestClient(app)

def run_tests():
    # Attempt login, if fails, register first
    res = client.post("/api/auth/login", json={"email": "test2@example.com", "password": "password123"})
    if res.status_code != 200:
        res = client.post("/api/auth/register", json={
            "email": "test2@example.com",
            "password": "password123",
            "nickname": "testuser2",
            "location": "Seoul"
        })
        res = client.post("/api/auth/login", json={"email": "test2@example.com", "password": "password123"})

    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("1. Testing Item Creation with Image...")
    # Mock image
    fake_image = io.BytesIO(b"fake image content")
    fake_image.name = "test.png"
    
    res = client.post("/api/items", headers=headers, data={
        "title": "Item with image",
        "price": 5000,
        "description": "Desc",
        "location": "Seoul"
    }, files={"image": ("test.png", fake_image, "image/png")})
    
    print("Create Item Status:", res.status_code)
    item_id = res.json()["id"]
    print("Item Image URL:", res.json()["image_url"])

    print("\n2. Testing Item Status Update...")
    res = client.put(f"/api/items/{item_id}/status", headers=headers, json={"status": "진행중"})
    print("Status Update:", res.status_code, res.json()["status"])

    print("\n3. Testing Item Like...")
    res = client.post(f"/api/items/{item_id}/like", headers=headers)
    print("Like Update:", res.status_code, "Likes count:", res.json()["likes"])

    print("\n4. Testing TownPost...")
    res = client.post("/api/town/posts", headers=headers, data={
        "category": "동네질문",
        "content": "Test post",
        "location": "Seoul"
    })
    print("TownPost Create:", res.status_code)

    print("\n5. Testing WebSockets...")
    with client.websocket_connect(f"/api/chats/ws/chat/1?token={token}") as websocket:
        websocket.send_text("Hello WebSocket")
        data = websocket.receive_text()
        print("WebSocket received:", data)

if __name__ == "__main__":
    run_tests()
