from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

import models, schemas, auth
from database import get_db

router = APIRouter()

@router.get("/test")
def test():
    return {"message": "API is working"}

# --- Experts ---
@router.get("/experts", response_model=List[schemas.ExpertResponse], tags=["experts"])
def get_experts(db: Session = Depends(get_db)):
    try:
        experts = db.query(models.Expert).options(joinedload(models.Expert.user)).all()
        results = []
        for exp in experts:
            results.append({
                "id": exp.id,
                "user_id": exp.user_id,
                "category": exp.category,
                "rating": float(exp.rating) if exp.rating is not None else 0.0,
                "review_count": int(exp.review_count) if exp.review_count is not None else 0,
                "description": exp.description,
                "nickname": exp.user.nickname if exp.user else "알 수 없음",
                "profile_image_url": exp.user.profile_image_url if exp.user else None
            })
        return results
    except Exception as e:
        print(f"Error in get_experts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Notifications ---
@router.get("/notifications", response_model=List[schemas.NotificationResponse], tags=["notifications"])
def get_notifications(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    notifications = db.query(models.Notification).filter(models.Notification.user_id == current_user.id).order_by(models.Notification.created_at.desc()).all()
    return notifications

@router.patch("/notifications/{notification_id}/read", tags=["notifications"])
def mark_notification_as_read(notification_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    noti = db.query(models.Notification).filter(models.Notification.id == notification_id, models.Notification.user_id == current_user.id).first()
    if not noti:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    noti.is_read = True
    db.commit()
    return {"status": "success"}

# --- Payment ---
@router.post("/payments/deposit", response_model=schemas.PaymentResponse, tags=["payments"])
def create_deposit(payment: schemas.PaymentCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # 1. Create Payment record
    db_payment = models.Payment(
        buleum_id=payment.buleum_id,
        payer_id=current_user.id,
        amount=payment.amount,
        payment_method=payment.payment_method,
        status="예치됨"
    )
    db.add(db_payment)
    
    # 2. Update Buleum status to '진행중'
    buleum = db.query(models.Buleum).filter(models.Buleum.id == payment.buleum_id).first()
    if buleum:
        buleum.status = "진행중"
        
        # 3. Notify the helper (or the other party)
        # Find the chat room or helper to notify
        # In a real app, you might want to find the specific user who is supposed to perform the task
        # For simplicity, we notify the owner of the buleum post or the person being paid
        notification = models.Notification(
            user_id=buleum.user_id, # Post owner
            type="accept",
            related_id=buleum.id,
            content=f"'{buleum.title}' 항목의 결제가 완료되었습니다. 서비스를 시작해 주세요!"
        )
        db.add(notification)
        
    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.post("/payments/{payment_id}/confirm", tags=["payments"])
def confirm_payment(payment_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # 1. Find the payment
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id, models.Payment.payer_id == current_user.id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status == "지급완료":
        raise HTTPException(status_code=400, detail="Already confirmed")
        
    # 2. Update statuses
    payment.status = "지급완료"
    
    buleum = db.query(models.Buleum).filter(models.Buleum.id == payment.buleum_id).first()
    if buleum:
        buleum.status = "완료"
        
        # 3. Notify the helper about the payout
        notification = models.Notification(
            user_id=buleum.user_id,
            type="accept",
            related_id=buleum.id,
            content=f"의뢰인이 구매 확정을 하였습니다. '{buleum.title}' 서비스 대금이 지급되었습니다."
        )
        db.add(notification)
        
    db.commit()
    return {"status": "success", "message": "Payment confirmed and funds released"}

# Get payment status for a specific buleum post
@router.get("/payments/buleum/{buleum_id}", response_model=Optional[schemas.PaymentResponse], tags=["payments"])
def get_buleum_payment(buleum_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    payment = db.query(models.Payment).filter(models.Payment.buleum_id == buleum_id).first()
    return payment

# --- Review ---
@router.post("/reviews", response_model=schemas.ReviewResponse, tags=["reviews"])
def create_review(review: schemas.ReviewCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_review = models.Review(
        reviewer_id=current_user.id,
        target_user_id=review.target_user_id,
        buleum_id=review.buleum_id,
        rating=review.rating,
        content=review.content
    )
    db.add(db_review)
    
    # Update manner temperature
    target_user = db.query(models.User).filter(models.User.id == review.target_user_id).first()
    if target_user:
        # Simple formula for demo: (rating - 3) * 0.1
        target_user.manner_temperature += (review.rating - 3) * 0.1
    
    db.commit()
    db.refresh(db_review)
    return db_review

# --- Verification ---
@router.post("/verification", response_model=schemas.VerificationResponse, tags=["verification"])
def request_verification(verification: schemas.VerificationCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_ver = models.Verification(
        user_id=current_user.id,
        type=verification.type,
        file_url=verification.file_url
    )
    db.add(db_ver)
    db.commit()
    db.refresh(db_ver)
    return db_ver
