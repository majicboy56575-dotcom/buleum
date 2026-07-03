from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from pydantic import BaseModel
import uuid
import random

import models, schemas, auth
from database import get_db
from email_utils import send_verification_email, send_verification_code_email, send_password_reset_code_email

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str


# ========================
# 6자리 인증코드 기반 이메일 인증
# ========================

@router.post("/auth/send-verification-code")
def send_verification_code(body: schemas.SendVerificationCode, db: Session = Depends(get_db)):
    """회원가입 전 이메일로 6자리 인증코드를 발송합니다."""
    
    # 이미 가입된 이메일인지 확인
    existing_user = db.query(models.User).filter(models.User.email == body.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="EMAIL_ALREADY_REGISTERED")
    
    # 6자리 난수 생성
    code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # 기존 인증 레코드가 있다면 업데이트, 없으면 새로 생성
    existing = db.query(models.EmailVerification).filter(
        models.EmailVerification.email == body.email
    ).first()
    
    if existing:
        existing.code = code
        existing.expires_at = expires_at
        existing.is_verified = False
        existing.created_at = datetime.utcnow()
    else:
        new_verification = models.EmailVerification(
            email=body.email,
            code=code,
            expires_at=expires_at,
            is_verified=False
        )
        db.add(new_verification)
    
    db.commit()
    
    # 이메일 발송
    try:
        send_verification_code_email(body.email, code)
    except Exception as e:
        print(f"[Warning] Failed to send verification code email: {e}")
        raise HTTPException(status_code=500, detail="EMAIL_SEND_FAILED")
    
    return {"message": "VERIFICATION_CODE_SENT"}


@router.post("/auth/verify-code")
def verify_code(body: schemas.VerifyCode, db: Session = Depends(get_db)):
    """사용자가 입력한 6자리 인증코드를 검증합니다."""
    
    record = db.query(models.EmailVerification).filter(
        models.EmailVerification.email == body.email
    ).first()
    
    if not record:
        raise HTTPException(status_code=400, detail="NO_VERIFICATION_RECORD")
    
    # 만료 확인
    if record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="CODE_EXPIRED")
    
    # 코드 일치 확인
    if record.code != body.code:
        raise HTTPException(status_code=400, detail="INVALID_CODE")
    
    # 인증 성공 처리
    record.is_verified = True
    db.commit()
    
    return {"message": "VERIFICATION_SUCCESS"}


# ========================
# 회원가입 / 로그인
# ========================

@router.post("/auth/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 이메일 중복 검사
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 닉네임 중복 검사
    db_nickname = db.query(models.User).filter(models.User.nickname == user.nickname).first()
    if db_nickname:
        raise HTTPException(status_code=400, detail="Nickname already taken")

    # ★ 이메일 인증 완료 여부를 교차 검증
    verification = db.query(models.EmailVerification).filter(
        models.EmailVerification.email == user.email,
        models.EmailVerification.is_verified == True
    ).first()
    
    if not verification:
        raise HTTPException(status_code=400, detail="EMAIL_NOT_VERIFIED")

    hashed_password = auth.get_password_hash(user.password)
    
    db_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        nickname=user.nickname,
        location=user.location,
        is_verified=True,  # 이미 인증 완료되었으므로 True
        verification_token=None,
        verification_token_expires=None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # 인증 레코드 정리 (가입 완료 후 삭제)
    db.query(models.EmailVerification).filter(
        models.EmailVerification.email == user.email
    ).delete()
    db.commit()
    
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
    
    # 이메일 미인증 사용자 로그인 차단
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED"
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ========================
# 레거시: 링크 기반 이메일 인증 (기존 사용자 호환용)
# ========================

# 이메일 인증 확인 API (링크 클릭 방식 - 레거시)
@router.post("/auth/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.verification_token == token
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="INVALID_TOKEN")
    
    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="TOKEN_EXPIRED")
    
    if user.is_verified:
        return {"message": "ALREADY_VERIFIED"}
    
    # 인증 처리
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()
    
    return {"message": "VERIFICATION_SUCCESS"}

# 인증 메일 재발송 API (레거시)
@router.post("/auth/resend-verification")
def resend_verification(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="ALREADY_VERIFIED")
    
    # 새 토큰 생성
    new_token = str(uuid.uuid4())
    user.verification_token = new_token
    user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
    db.commit()
    
    try:
        send_verification_email(user.email, new_token)
    except Exception as e:
        raise HTTPException(status_code=500, detail="EMAIL_SEND_FAILED")
    
    return {"message": "VERIFICATION_RESENT"}

# ========================
# 사용자 프로필
# ========================

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


# ========================
# 비밀번호 찾기 (재설정)
# ========================

@router.post("/auth/forgot-password")
def forgot_password(body: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """비밀번호 재설정을 위한 6자리 인증코드를 이메일로 발송합니다."""
    
    # 가입된 이메일인지 확인 (보안: 미가입이어도 동일 응답)
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        # 보안을 위해 이메일 존재 여부를 노출하지 않음
        return {"message": "RESET_CODE_SENT"}
    
    # 6자리 난수 생성
    code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # 기존 인증 레코드가 있다면 업데이트, 없으면 새로 생성
    existing = db.query(models.EmailVerification).filter(
        models.EmailVerification.email == body.email
    ).first()
    
    if existing:
        existing.code = code
        existing.expires_at = expires_at
        existing.is_verified = False
        existing.created_at = datetime.utcnow()
    else:
        new_verification = models.EmailVerification(
            email=body.email,
            code=code,
            expires_at=expires_at,
            is_verified=False
        )
        db.add(new_verification)
    
    db.commit()
    
    # 비밀번호 재설정 인증코드 이메일 발송
    try:
        send_password_reset_code_email(body.email, code)
    except Exception as e:
        print(f"[Warning] Failed to send password reset code email: {e}")
        raise HTTPException(status_code=500, detail="EMAIL_SEND_FAILED")
    
    return {"message": "RESET_CODE_SENT"}


@router.post("/auth/verify-reset-code")
def verify_reset_code(body: schemas.VerifyCode, db: Session = Depends(get_db)):
    """비밀번호 재설정용 6자리 인증코드를 검증합니다."""
    
    record = db.query(models.EmailVerification).filter(
        models.EmailVerification.email == body.email
    ).first()
    
    if not record:
        raise HTTPException(status_code=400, detail="NO_VERIFICATION_RECORD")
    
    # 만료 확인
    if record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="CODE_EXPIRED")
    
    # 코드 일치 확인
    if record.code != body.code:
        raise HTTPException(status_code=400, detail="INVALID_CODE")
    
    # 인증 성공 처리
    record.is_verified = True
    db.commit()
    
    return {"message": "RESET_CODE_VERIFIED"}


@router.post("/auth/reset-password")
def reset_password(body: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """인증 완료 후 새 비밀번호를 설정합니다."""
    
    # 인증 완료된 레코드가 있는지 교차 검증
    verification = db.query(models.EmailVerification).filter(
        models.EmailVerification.email == body.email,
        models.EmailVerification.is_verified == True
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="VERIFICATION_REQUIRED"
        )
    
    # 사용자 조회
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    
    # 새 비밀번호 해시 생성 및 업데이트
    user.password_hash = auth.get_password_hash(body.new_password)
    
    # 사용된 인증 레코드 삭제 (일회용 보장)
    db.query(models.EmailVerification).filter(
        models.EmailVerification.email == body.email
    ).delete()
    
    db.commit()
    
    return {"message": "PASSWORD_RESET_SUCCESS"}
