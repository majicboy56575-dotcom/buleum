from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from pydantic import BaseModel

import models, schemas, auth
from database import get_db

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/auth/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_nickname = db.query(models.User).filter(models.User.nickname == user.nickname).first()
    if db_nickname:
        raise HTTPException(status_code=400, detail="Nickname already taken")

    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        nickname=user.nickname,
        location=user.location
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/auth/login", response_model=schemas.Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/users/me", response_model=schemas.UserResponse)
def update_user_me(
    user_update: schemas.UserUpdate, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.nickname:
        current_user.nickname = user_update.nickname
    if user_update.location:
        current_user.location = user_update.location
    if user_update.profile_image_url:
        current_user.profile_image_url = user_update.profile_image_url
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/users/me/requests", response_model=List[schemas.ItemResponse])
def get_my_requests(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # 내가 작성한 부름글 목록
    items = db.query(models.Buleum).filter(models.Buleum.user_id == current_user.id).order_by(models.Buleum.created_at.desc()).all()
    return items

@router.get("/users/me/progress", response_model=List[schemas.ItemResponse])
def get_my_progress(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # 내가 헬퍼로 참여하고 있는 채팅방의 부름글 목록 (간단히 구현)
    chat_rooms = db.query(models.ChatRoom).filter(models.ChatRoom.helper_id == current_user.id).all()
    buleum_ids = [room.buleum_id for room in chat_rooms if room.buleum_id is not None]
    
    items = db.query(models.Buleum).filter(models.Buleum.id.in_(buleum_ids)).order_by(models.Buleum.created_at.desc()).all()
    return items
