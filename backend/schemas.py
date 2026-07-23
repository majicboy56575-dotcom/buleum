from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ========================
# User Schemas
# ========================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nickname: str
    location: Optional[str] = None
    firebase_token: str

class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    location: Optional[str] = None
    profile_image_url: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    nickname: str
    location: Optional[str]
    manner_temperature: float
    profile_image_url: Optional[str]
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ========================
# Auth Schemas
# ========================
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ========================
# Buleum (Item) Schemas
# ========================
class ItemCreate(BaseModel):
    title: str
    price: int
    description: str
    location: str
    image_url: Optional[str] = None

class ItemStatusUpdate(BaseModel):
    status: str

class ItemResponse(BaseModel):
    id: int
    user_id: int
    title: str
    price: int
    description: str
    location: str
    image_url: Optional[str]
    status: str
    likes: int
    chat_count: int
    created_at: datetime
    user_nickname: Optional[str] = None

    class Config:
        from_attributes = True

# ========================
# TownPost Schemas
# ========================
class TownPostCreate(BaseModel):
    category: str
    content: str
    location: str
    image_url: Optional[str] = None

class TownPostResponse(BaseModel):
    id: int
    user_id: int
    category: str
    content: str
    location: str
    image_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ========================
# Chat Schemas
# ========================
class ChatRoomCreate(BaseModel):
    buleum_id: Optional[int] = None
    helper_id: Optional[int] = None

class ChatRoomResponse(BaseModel):
    id: int
    buleum_id: Optional[int]
    requester_id: int
    helper_id: int
    other_nickname: str
    buleum_title: Optional[str]
    last_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: int
    room_id: int
    sender_id: int
    content: str
    message_type: str = "text"
    file_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ========================
# Expert Schemas
# ========================
class ExpertResponse(BaseModel):
    id: int
    user_id: int
    category: str
    rating: float
    review_count: int
    description: Optional[str]
    nickname: Optional[str]
    profile_image_url: Optional[str]

    class Config:
        from_attributes = True

# ========================
# Notification Schemas
# ========================
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    related_id: Optional[int]
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ========================
# Payment Schemas
# ========================
class PaymentCreate(BaseModel):
    buleum_id: int
    amount: int
    payment_method: str

class PaymentResponse(BaseModel):
    id: int
    buleum_id: int
    payer_id: int
    amount: int
    payment_method: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ========================
# Review Schemas
# ========================
class ReviewCreate(BaseModel):
    target_user_id: int
    buleum_id: int
    rating: int
    content: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    reviewer_id: int
    target_user_id: int
    buleum_id: int
    rating: int
    content: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ========================
# Verification Schemas
# ========================
class VerificationCreate(BaseModel):
    type: str
    file_url: str

class VerificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    file_url: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ========================
# Email Verification Code Schemas (레거시 - 더 이상 사용하지 않음)
# Firebase Authentication으로 대체됨
# ========================

class AISimulatedUserCreate(BaseModel):
    """AI가 가상 사용자를 생성할 때 사용하는 스키마"""
    email: EmailStr
    nickname: str
    location: Optional[str] = None
    profile_image_url: Optional[str] = None
    manner_temperature: Optional[float] = 36.5

class AISimulatedUserResponse(BaseModel):
    """가상 사용자 조회 응답 스키마"""
    id: int
    email: EmailStr
    nickname: str
    location: Optional[str]
    manner_temperature: float
    profile_image_url: Optional[str]
    is_simulated: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AIBuleumCreate(BaseModel):
    """AI가 가상 사용자 명의로 심부름 게시글을 등록할 때 사용하는 스키마"""
    user_id: int
    title: str
    price: int
    description: str
    location: str
    image_url: Optional[str] = None

class AIPendingChatRoom(BaseModel):
    """AI가 답장하지 않은 채팅방 정보 스키마"""
    room_id: int
    buleum_id: Optional[int]
    buleum_title: Optional[str]
    simulated_user_id: int
    simulated_user_nickname: str
    real_user_id: int
    real_user_nickname: str
    last_message_content: str
    last_message_time: datetime
    unanswered_count: int

class AIChatReply(BaseModel):
    """AI가 가상 사용자 대신 채팅 답장을 보낼 때 사용하는 스키마"""
    content: str

# ========================
# Password Reset Schemas (레거시 - 더 이상 사용하지 않음)
# Firebase Authentication의 sendPasswordResetEmail로 대체됨
# ========================
