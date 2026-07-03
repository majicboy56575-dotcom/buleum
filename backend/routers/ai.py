"""
부름 사이트 AI 관리 전용 API 라우터
- API 키(X-API-Key 헤더) 인증 방식
- 가상 사용자 생성/조회
- 가상 심부름 게시글 등록
- 미답변 채팅 대기열 조회
- 가상 사용자 대신 채팅 답장 (WebSocket 실시간 브로드캐스트 연동)
"""

from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional
from datetime import datetime
import os
import json as json_module

import models, schemas, auth
from database import get_db

router = APIRouter(tags=["ai-management"])

# ==============================
# API 키 인증 종속성 (Dependency)
# ==============================
AI_API_KEY = os.getenv("AI_API_KEY")

def get_api_key(x_api_key: str = Header(..., alias="X-API-Key")):
    """
    X-API-Key 헤더를 검증하는 FastAPI 종속성 함수.
    .env 파일의 AI_API_KEY 값과 일치하지 않으면 403 에러를 반환합니다.
    """
    if not AI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="서버에 AI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요."
        )
    if x_api_key != AI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="유효하지 않은 API 키입니다."
        )
    return x_api_key


# ==============================
# 1. 가상 사용자 관리
# ==============================

@router.post("/users", response_model=schemas.AISimulatedUserResponse)
def create_simulated_user(
    user_data: schemas.AISimulatedUserCreate,
    api_key: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    """AI가 관리할 가상 사용자를 생성합니다."""
    # 이메일 중복 확인
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"이미 존재하는 이메일입니다: {user_data.email}")

    # 닉네임 중복 확인
    existing_nick = db.query(models.User).filter(models.User.nickname == user_data.nickname).first()
    if existing_nick:
        raise HTTPException(status_code=400, detail=f"이미 존재하는 닉네임입니다: {user_data.nickname}")

    # 가상 사용자는 랜덤 비밀번호 해시를 생성하여 로그인 불가하도록 설정
    import uuid
    dummy_password = auth.get_password_hash(str(uuid.uuid4()))

    new_user = models.User(
        email=user_data.email,
        password_hash=dummy_password,
        nickname=user_data.nickname,
        location=user_data.location,
        manner_temperature=user_data.manner_temperature or 36.5,
        profile_image_url=user_data.profile_image_url,
        is_verified=True,       # 이메일 인증 완료 상태로 설정
        is_simulated=True,      # 가상 사용자 표시
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.get("/users", response_model=List[schemas.AISimulatedUserResponse])
def list_simulated_users(
    api_key: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    """현재 등록된 가상 사용자 목록을 조회합니다."""
    users = db.query(models.User).filter(
        models.User.is_simulated == True
    ).order_by(models.User.created_at.desc()).all()
    return users


# ==============================
# 2. 가상 심부름 게시글 관리
# ==============================

@router.post("/items", response_model=schemas.ItemResponse)
def create_simulated_item(
    item_data: schemas.AIBuleumCreate,
    api_key: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    """특정 가상 사용자 명의로 심부름 게시글(부름)을 등록합니다."""
    # 해당 user_id가 가상 사용자인지 확인
    user = db.query(models.User).filter(
        models.User.id == item_data.user_id,
        models.User.is_simulated == True
    ).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"가상 사용자를 찾을 수 없습니다 (user_id: {item_data.user_id}). "
                   f"먼저 POST /api/ai/users 로 가상 사용자를 생성해주세요."
        )

    db_item = models.Buleum(
        user_id=item_data.user_id,
        title=item_data.title,
        price=item_data.price,
        description=item_data.description,
        location=item_data.location,
        image_url=item_data.image_url,
        status="대기중"
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    item_dict = {c.name: getattr(db_item, c.name) for c in db_item.__table__.columns}
    item_dict["user_nickname"] = user.nickname
    return item_dict


# ==============================
# 3. 미답변 채팅 대기열 조회
# ==============================

@router.get("/chats/pending", response_model=List[schemas.AIPendingChatRoom])
def get_pending_chats(
    api_key: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    """
    실제 사용자가 가상 사용자에게 보낸 메시지 중,
    아직 가상 사용자(AI)가 답장하지 않은 채팅방 목록을 조회합니다.
    
    판단 기준: 채팅방의 마지막 메시지 발신자가 실제 사용자(is_simulated=False)이면 미답변 상태.
    """
    # 가상 사용자가 참여한 모든 채팅방 조회
    simulated_user_ids = db.query(models.User.id).filter(
        models.User.is_simulated == True
    ).subquery().select()

    rooms = db.query(models.ChatRoom).filter(
        or_(
            models.ChatRoom.requester_id.in_(simulated_user_ids),
            models.ChatRoom.helper_id.in_(simulated_user_ids)
        )
    ).all()

    pending_rooms = []

    for room in rooms:
        # 채팅방에서 가상 사용자와 실제 사용자 식별
        requester = db.query(models.User).filter(models.User.id == room.requester_id).first()
        helper = db.query(models.User).filter(models.User.id == room.helper_id).first()

        if not requester or not helper:
            continue

        if requester.is_simulated:
            simulated_user = requester
            real_user = helper
        elif helper.is_simulated:
            simulated_user = helper
            real_user = requester
        else:
            continue  # 양쪽 다 실제 사용자인 경우 건너뛰기

        # 마지막 메시지 조회
        last_message = db.query(models.ChatMessage).filter(
            models.ChatMessage.room_id == room.id
        ).order_by(models.ChatMessage.created_at.desc()).first()

        if not last_message:
            continue  # 메시지가 없는 채팅방 건너뛰기

        # 마지막 메시지가 실제 사용자가 보낸 것이라면 → 미답변 상태
        if last_message.sender_id == real_user.id:
            # 가상 사용자의 마지막 답장 시각 이후 실제 사용자가 보낸 메시지 수 계산
            last_sim_reply = db.query(models.ChatMessage).filter(
                models.ChatMessage.room_id == room.id,
                models.ChatMessage.sender_id == simulated_user.id
            ).order_by(models.ChatMessage.created_at.desc()).first()

            if last_sim_reply:
                unanswered = db.query(models.ChatMessage).filter(
                    models.ChatMessage.room_id == room.id,
                    models.ChatMessage.sender_id == real_user.id,
                    models.ChatMessage.created_at > last_sim_reply.created_at
                ).count()
            else:
                # 가상 사용자가 한 번도 답장한 적 없으면 실제 사용자 메시지 전체가 미답변
                unanswered = db.query(models.ChatMessage).filter(
                    models.ChatMessage.room_id == room.id,
                    models.ChatMessage.sender_id == real_user.id
                ).count()

            # 부름 제목 가져오기
            buleum_title = None
            if room.buleum_id:
                buleum = db.query(models.Buleum).filter(models.Buleum.id == room.buleum_id).first()
                if buleum:
                    buleum_title = buleum.title

            pending_rooms.append(schemas.AIPendingChatRoom(
                room_id=room.id,
                buleum_id=room.buleum_id,
                buleum_title=buleum_title,
                simulated_user_id=simulated_user.id,
                simulated_user_nickname=simulated_user.nickname,
                real_user_id=real_user.id,
                real_user_nickname=real_user.nickname,
                last_message_content=last_message.content,
                last_message_time=last_message.created_at,
                unanswered_count=unanswered
            ))

    # 최신 메시지 순으로 정렬
    pending_rooms.sort(key=lambda x: x.last_message_time, reverse=True)
    return pending_rooms


# ==============================
# 4. 가상 사용자 대신 채팅 답장
# ==============================

@router.post("/chats/{room_id}/reply")
async def reply_as_simulated_user(
    room_id: int,
    reply_data: schemas.AIChatReply,
    api_key: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    """
    AI가 가상 사용자를 대변하여 특정 채팅방에 답장을 보냅니다.
    메시지는 DB에 저장되고, WebSocket 브로드캐스트를 통해 
    실제 사용자 브라우저에 실시간으로 전송됩니다.
    """
    # 채팅방 조회
    room = db.query(models.ChatRoom).filter(models.ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail=f"채팅방을 찾을 수 없습니다 (room_id: {room_id})")

    # 채팅방에 참여한 가상 사용자 식별
    requester = db.query(models.User).filter(models.User.id == room.requester_id).first()
    helper = db.query(models.User).filter(models.User.id == room.helper_id).first()

    simulated_user = None
    real_user = None

    if requester and requester.is_simulated:
        simulated_user = requester
        real_user = helper
    elif helper and helper.is_simulated:
        simulated_user = helper
        real_user = requester

    if not simulated_user:
        raise HTTPException(
            status_code=400,
            detail="이 채팅방에는 가상 사용자가 참여하지 않았습니다. AI 답장 대상이 아닙니다."
        )

    # DB에 메시지 저장 (가상 사용자가 보낸 것으로)
    db_message = models.ChatMessage(
        room_id=room_id,
        sender_id=simulated_user.id,
        content=reply_data.content,
        message_type="text",
        file_url=None
    )
    db.add(db_message)

    # 실제 사용자에게 알림 생성
    notif_content = (
        f"{simulated_user.nickname}님이 메시지를 보냈습니다: "
        f"{reply_data.content[:20]}{'...' if len(reply_data.content) > 20 else ''}"
    )
    db_notification = models.Notification(
        user_id=real_user.id,
        type="chat",
        related_id=room_id,
        content=notif_content,
        is_read=False
    )
    db.add(db_notification)

    db.commit()
    db.refresh(db_message)

    # WebSocket 브로드캐스트 (실시간 전송)
    try:
        from routers.chat import manager
        created_at_str = db_message.created_at.isoformat() if db_message.created_at else datetime.utcnow().isoformat()
        broadcast_data = {
            "sender_nickname": simulated_user.nickname,
            "sender_id": simulated_user.id,
            "content": reply_data.content,
            "message_type": "text",
            "file_url": None,
            "created_at": created_at_str
        }
        await manager.broadcast(json_module.dumps(broadcast_data, ensure_ascii=False), room_id)
    except Exception as e:
        # WebSocket 연결이 없어도 DB 저장은 성공했으므로 에러를 무시
        print(f"[AI Reply] WebSocket 브로드캐스트 실패 (room {room_id}): {e}")

    return {
        "success": True,
        "message": "답장이 성공적으로 전송되었습니다.",
        "room_id": room_id,
        "sender_nickname": simulated_user.nickname,
        "content": reply_data.content,
        "created_at": db_message.created_at.isoformat()
    }
