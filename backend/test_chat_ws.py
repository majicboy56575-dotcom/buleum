import asyncio
import websockets
import json
import requests

BACKEND_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/ws/chat"

async def test_chat():
    # 1. Login to get token
    login_data = {"email": "admin@gmail.com", "password": "pass123"}
    response = requests.post(f"{BACKEND_URL}/api/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    print(f"Logged in, token: {token[:20]}...")

    # 2. Get rooms
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BACKEND_URL}/api/chats/rooms", headers=headers)
    rooms = response.json()
    if not rooms:
        print("No chat rooms found. Creating one...")
        # Create a room. Need a buleum_id or helper_id.
        # Let's find an item.
        response = requests.get(f"{BACKEND_URL}/api/items")
        items = response.json()
        if not items:
            print("No items found to chat about.")
            return
        
        # Try to chat about the first item (if not ours)
        item_id = items[0]["id"]
        response = requests.post(f"{BACKEND_URL}/api/chats/rooms", json={"buleum_id": item_id}, headers=headers)
        if response.status_code != 200:
            print(f"Failed to create room: {response.text}")
            return
        room_id = response.json()["id"]
    else:
        room_id = rooms[0]["id"]
    
    print(f"Using room_id: {room_id}")

    # 3. Connect to WebSocket
    uri = f"{WS_URL}/{room_id}?token={token}"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket")
            
            # Send a message
            message = "Hello from test script"
            await websocket.send(message)
            print(f"Sent: {message}")
            
            # Receive response
            response = await websocket.recv()
            print(f"Received: {response}")
            
            data = json.loads(response)
            if data["content"] == message:
                print("SUCCESS: Message broadcasted correctly")
            else:
                print(f"FAILURE: Content mismatch. Expected {message}, got {data['content']}")

    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    asyncio.run(test_chat())
