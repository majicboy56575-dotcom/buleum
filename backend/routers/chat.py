from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Dict
from jose import JWTError, jwt
import os
import uuid
import shutil

import models, schemas, auth
from database import get_db

router = APIRouter(tags=["chat"])

CHAT_UPLOAD_DIR = "uploads/chat"
os.makedirs(CHAT_UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: int):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: int):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: str, room_id: int):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.post("/chats/rooms", response_model=schemas.ChatRoomResponse)
def create_chat_room(room_data: schemas.ChatRoomCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if room_data.buleum_id:
        # Buleum post chat: current_user is helper
        buleum = db.query(models.Buleum).filter(models.Buleum.id == room_data.buleum_id).first()
        if not buleum:
            raise HTTPException(status_code=404, detail="Buleum not found")
        
        requester_id = buleum.user_id
        helper_id = current_user.id
        
        if requester_id == helper_id:
            raise HTTPException(status_code=400, detail="본인이 작성한 글에는 채팅할 수 없습니다.")
    elif room_data.helper_id:
        # Direct expert chat: current_user is requester
        requester_id = current_user.id
        helper_id = room_data.helper_id
        
        if requester_id == helper_id:
            raise HTTPException(status_code=400, detail="본인과는 채팅할 수 없습니다.")
    else:
        raise HTTPException(status_code=400, detail="buleum_id 또는 helper_id가 필요합니다.")

    # Check if room already exists
    existing_room = db.query(models.ChatRoom).filter(
        models.ChatRoom.buleum_id == room_data.buleum_id,
        models.ChatRoom.requester_id == requester_id,
        models.ChatRoom.helper_id == helper_id
    ).first()
    
    if existing_room:
        other_user_id = helper_id if requester_id == current_user.id else requester_id
        other_user = db.query(models.User).filter(models.User.id == other_user_id).first()
        buleum = db.query(models.Buleum).filter(models.Buleum.id == existing_room.buleum_id).first() if existing_room.buleum_id else None
        
        return {
            "id": existing_room.id,
            "buleum_id": existing_room.buleum_id,
            "requester_id": existing_room.requester_id,
            "helper_id": existing_room.helper_id,
            "other_nickname": other_user.nickname if other_user else "알 수 없음",
            "buleum_title": buleum.title if buleum else "",
            "last_message": "이전 대화를 확인하세요.",
            "created_at": existing_room.created_at
        }

    db_room = models.ChatRoom(
        buleum_id=room_data.buleum_id,
        requester_id=requester_id,
        helper_id=helper_id
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    
    other_user_id = helper_id if requester_id == current_user.id else requester_id
    other_user = db.query(models.User).filter(models.User.id == other_user_id).first()
    buleum_title = ""
    if room_data.buleum_id:
        buleum = db.query(models.Buleum).filter(models.Buleum.id == room_data.buleum_id).first()
        if buleum:
            buleum_title = buleum.title
    
    return {
        "id": db_room.id,
        "buleum_id": db_room.buleum_id,
        "requester_id": db_room.requester_id,
        "helper_id": db_room.helper_id,
        "other_nickname": other_user.nickname if other_user else "알 수 없음",
        "buleum_title": buleum_title,
        "last_message": "대화를 시작해보세요.",
        "created_at": db_room.created_at
    }

@router.get("/chats/rooms", response_model=List[schemas.ChatRoomResponse])
def get_chat_rooms(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Rooms where user is either requester or helper
    rooms = db.query(models.ChatRoom).filter(
        (models.ChatRoom.requester_id == current_user.id) | 
        (models.ChatRoom.helper_id == current_user.id)
    ).order_by(models.ChatRoom.created_at.desc()).all()
    
    results = []
    for room in rooms:
        # Find the other person
        other_user_id = room.helper_id if room.requester_id == current_user.id else room.requester_id
        other_user = db.query(models.User).filter(models.User.id == other_user_id).first()
        
        # Find buleum title
        buleum_title = ""
        if room.buleum_id:
            buleum = db.query(models.Buleum).filter(models.Buleum.id == room.buleum_id).first()
            if buleum:
                buleum_title = buleum.title
        
        # Get last message
        last_msg = db.query(models.ChatMessage).filter(models.ChatMessage.room_id == room.id).order_by(models.ChatMessage.created_at.desc()).first()
        last_message_text = last_msg.content if last_msg else "대화를 시작해보세요."

        results.append({
            "id": room.id,
            "buleum_id": room.buleum_id,
            "requester_id": room.requester_id,
            "helper_id": room.helper_id,
            "other_nickname": other_user.nickname if other_user else "알 수 없음",
            "buleum_title": buleum_title,
            "last_message": last_message_text,
            "created_at": room.created_at
        })
    return results

@router.get("/chats/rooms/{room_id}/messages", response_model=List[schemas.ChatMessageResponse])
def get_chat_messages(room_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Verify user is in the room
    room = db.query(models.ChatRoom).filter(
        (models.ChatRoom.id == room_id) & 
        ((models.ChatRoom.requester_id == current_user.id) | (models.ChatRoom.helper_id == current_user.id))
    ).first()
    
    if not room:
        raise HTTPException(status_code=403, detail="Room not found or access denied")
        
    messages = db.query(models.ChatMessage).filter(models.ChatMessage.room_id == room_id).order_by(models.ChatMessage.created_at.asc()).all()
    return messages


@router.post("/chats/rooms/{room_id}/upload")
async def upload_chat_media(
    room_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """채팅방에 이미지 또는 동영상 파일을 업로드합니다."""
    # 1. 채팅방 접근 권한 확인
    room = db.query(models.ChatRoom).filter(
        (models.ChatRoom.id == room_id) &
        ((models.ChatRoom.requester_id == current_user.id) | (models.ChatRoom.helper_id == current_user.id))
    ).first()
    if not room:
        raise HTTPException(status_code=403, detail="채팅방 접근 권한이 없습니다.")

    # 2. 파일 타입 확인
    content_type = file.content_type or ""
    if content_type in ALLOWED_IMAGE_TYPES:
        message_type = "image"
    elif content_type in ALLOWED_VIDEO_TYPES:
        message_type = "video"
    else:
        raise HTTPException(
            status_code=400,
            detail="지원하지 않는 파일 형식입니다. (이미지: jpg, png, gif, webp / 동영상: mp4, mov, webm)"
        )

    # 3. 파일 크기 제한 확인 (50MB)
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기는 최대 50MB까지 허용됩니다.")

    # 4. 고유 파일명으로 저장
    ext = os.path.splitext(file.filename or "")[1] or (".jpg" if message_type == "image" else ".mp4")
    unique_filename = f"{uuid.uuid4()}{ext}"
    save_path = os.path.join(CHAT_UPLOAD_DIR, unique_filename)

    with open(save_path, "wb") as f:
        f.write(file_content)

    file_url = f"/uploads/chat/{unique_filename}"
    return {"file_url": file_url, "message_type": message_type}
