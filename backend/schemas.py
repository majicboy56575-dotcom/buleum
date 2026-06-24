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
# Email Verification Code Schemas
# ========================
class SendVerificationCode(BaseModel):
    email: EmailStr

class VerifyCode(BaseModel):
    email: EmailStr
    code: str
