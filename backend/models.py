from sqlalchemy import Boolean, Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    nickname = Column(String, unique=True, index=True, nullable=False)
    location = Column(String, nullable=True)
    manner_temperature = Column(Float, default=36.5)
    profile_image_url = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    buleums = relationship("Buleum", back_populates="user")
    town_posts = relationship("TownPost", back_populates="user")
    expert_profile = relationship("Expert", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")

class Buleum(Base):
    __tablename__ = "buleums"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    status = Column(String, default="대기중") # 대기중, 진행중, 완료
    likes = Column(Integer, default=0)
    chat_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="buleums")
    payments = relationship("Payment", back_populates="buleum", cascade="all, delete-orphan")

    @property
    def user_nickname(self):
        return self.user.nickname if self.user else "알 수 없음"

class TownPost(Base):
    __tablename__ = "town_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="town_posts")

class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    buleum_id = Column(Integer, ForeignKey("buleums.id"), nullable=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    helper_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="room")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String, default="text")  # text, image, video
    file_url = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("ChatRoom", back_populates="messages")

class Expert(Base):
    __tablename__ = "experts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    category = Column(String, nullable=False)
    rating = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    description = Column(Text, nullable=True)

    user = relationship("User", back_populates="expert_profile")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False) # chat, accept, comment, review
    related_id = Column(Integer, nullable=True) # ID of chat room, post, etc.
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    buleum_id = Column(Integer, ForeignKey("buleums.id"), nullable=True)
    payer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    payment_method = Column(String, nullable=False)
    status = Column(String, default="예치됨") # 예치됨, 지급완료
    created_at = Column(DateTime, default=datetime.utcnow)

    buleum = relationship("Buleum", back_populates="payments")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    buleum_id = Column(Integer, ForeignKey("buleums.id"), nullable=True)
    rating = Column(Integer, nullable=False) # 1~5
    content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    status = Column(String, default="심사중") # 심사중, 승인됨, 거절됨
    created_at = Column(DateTime, default=datetime.utcnow)

class UserItemLike(Base):
    __tablename__ = "user_item_likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    buleum_id = Column(Integer, ForeignKey("buleums.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
