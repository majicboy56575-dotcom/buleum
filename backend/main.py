from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database import get_db, engine, SessionLocal
from jose import JWTError, jwt
import os
import models, auth

from routers import users, items, town, chat, others, admin

# 애플리케이션 시작 시 DB 테이블 자동 생성 (buleum.db)
models.Base.metadata.create_all(bind=engine)

# 관리자 계정 시딩 (admin@gmail.com / pass123)
def seed_admin():
    db = SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.email == "admin@gmail.com").first()
        if not admin_user:
            hashed_password = auth.get_password_hash("pass123")
            new_admin = models.User(
                email="admin@gmail.com",
                password_hash=hashed_password,
                nickname="관리자",
                is_admin=True,
                is_verified=True
            )
            db.add(new_admin)
            db.commit()
            print("Admin account created: admin@gmail.com / pass123")
    finally:
        db.close()

seed_admin()

os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/chat", exist_ok=True)

app = FastAPI(title="Buleum API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(users.router, prefix="/api")
app.include_router(items.router, prefix="/api")
app.include_router(town.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(others.router, prefix="/api")
app.include_router(admin.router, prefix="/api/admin")

@app.get("/")
def read_root():
    return {"message": "Welcome to Buleum API"}

@app.websocket("/ws/chat/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    room_id: int, 
    token: str = Query(default=None)
):
    import json as json_module
    import traceback
    from datetime import datetime as dt
    from routers.chat import manager
    
    # 1단계: WebSocket 연결 수락
    try:
        await websocket.accept()
    except Exception as e:
        print(f"WebSocket accept failed in room {room_id}: {e}")
        return
    
    db = SessionLocal()
    user = None

    try:
        # 2단계: 토큰 검증
        if not token:
            await websocket.send_text(json_module.dumps({"error": "Token missing"}))
            await websocket.close(code=1008)
            return

        try:
            payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
            email: str = payload.get("sub")
        except JWTError:
            await websocket.send_text(json_module.dumps({"error": "Invalid token"}))
            await websocket.close(code=1008)
            return

        if not email:
            await websocket.send_text(json_module.dumps({"error": "Invalid token payload"}))
            await websocket.close(code=1008)
            return

        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            await websocket.send_text(json_module.dumps({"error": "User not found"}))
            await websocket.close(code=1008)
            return

        print(f"WebSocket authenticated: room {room_id}, user {user.nickname}")
        
        # ConnectionManager에 등록
        if room_id not in manager.active_connections:
            manager.active_connections[room_id] = []
        
        if websocket not in manager.active_connections[room_id]:
            manager.active_connections[room_id].append(websocket)
        
        # 3단계: 메시지 수신 루프
        while True:
            try:
                data = await websocket.receive_text()
            except Exception:
                # 클라이언트 연결 종료 (WebSocketDisconnect 등)
                break

            if not data or not data.strip():
                continue

            try:
                # JSON 형식인 경우 content, message_type, file_url 추출
                try:
                    msg_obj = json_module.loads(data)
                    if isinstance(msg_obj, dict):
                        content = msg_obj.get("content", "")
                        message_type = msg_obj.get("message_type", "text")
                        file_url = msg_obj.get("file_url", None)
                    else:
                        content = data
                        message_type = "text"
                        file_url = None
                except (json_module.JSONDecodeError, AttributeError):
                    content = data
                    message_type = "text"
                    file_url = None

                # 이미지/동영상 메시지는 content 없어도 허용
                if message_type == "text" and (not content or not content.strip()):
                    continue

                # DB에 메시지 저장
                db_message = models.ChatMessage(
                    room_id=room_id,
                    sender_id=user.id,
                    content=content or "",
                    message_type=message_type,
                    file_url=file_url
                )
                db.add(db_message)

                # 상대방에게 알림 생성
                room = db.query(models.ChatRoom).filter(models.ChatRoom.id == room_id).first()
                if room:
                    receiver_id = room.helper_id if room.requester_id == user.id else room.requester_id
                    if message_type == "text":
                        notif_content = f"{user.nickname}님이 메시지를 보냈습니다: {content[:20]}{'...' if len(content) > 20 else ''}"
                    elif message_type == "image":
                        notif_content = f"{user.nickname}님이 사진을 보냈습니다."
                    else:
                        notif_content = f"{user.nickname}님이 동영상을 보냈습니다."

                    db_notification = models.Notification(
                        user_id=receiver_id,
                        type="chat",
                        related_id=room_id,
                        content=notif_content,
                        is_read=False
                    )
                    db.add(db_notification)

                db.commit()
                db.refresh(db_message)

                # 브로드캐스트 데이터 구성
                created_at_str = db_message.created_at.isoformat() if db_message.created_at else dt.utcnow().isoformat()
                broadcast_data = {
                    "sender_nickname": user.nickname,
                    "sender_id": user.id,
                    "content": content or "",
                    "message_type": message_type,
                    "file_url": file_url,
                    "created_at": created_at_str
                }
                await manager.broadcast(json_module.dumps(broadcast_data, ensure_ascii=False), room_id)
                print(f"Message in room {room_id} from {user.nickname}: [{message_type}] {content[:30] if content else ''}")

            except Exception as e:
                print(f"[Error] Error processing message in room {room_id}: {e}")
                db.rollback()

    except Exception as e:
        print(f"[Error] WebSocket outer error in room {room_id}: {e}")
        traceback.print_exc()
    finally:
        # 안전한 연결 해제
        if room_id in manager.active_connections:
            if websocket in manager.active_connections[room_id]:
                manager.active_connections[room_id].remove(websocket)
            if not manager.active_connections[room_id]:
                del manager.active_connections[room_id]
        
        db.close()
        if user:
            print(f"WebSocket disconnected: room {room_id}, user {user.nickname}")
        else:
            print(f"WebSocket disconnected: room {room_id} (unauthenticated)")



