from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
import models, schemas, auth
from database import get_db

router = APIRouter()

# Dependency to check if current user is admin
def admin_required(current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다."
        )
    return current_user

@router.get("/stats", response_model=Dict)
def get_dashboard_stats(
    admin: models.User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    total_users = db.query(models.User).count()
    total_items = db.query(models.Buleum).count()
    completed_items = db.query(models.Buleum).filter(models.Buleum.status == "완료").count()
    active_experts = db.query(models.Expert).count()
    total_payments = db.query(models.Payment).count()
    
    return {
        "total_users": total_users,
        "total_items": total_items,
        "completed_items": completed_items,
        "active_experts": active_experts,
        "total_payments": total_payments
    }

@router.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(
    admin: models.User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: models.User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    if user.is_admin:
        raise HTTPException(status_code=400, detail="관리자 계정은 삭제할 수 없습니다.")
    
    db.delete(user)
    db.commit()
    return {"message": "사용자가 탈퇴 처리되었습니다."}

@router.get("/items", response_model=List[schemas.ItemResponse])
def get_all_items(
    admin: models.User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    items = db.query(models.Buleum).order_by(models.Buleum.created_at.desc()).all()
    results = []
    for item in items:
        item_dict = {c.name: getattr(item, c.name) for c in item.__table__.columns}
        item_dict["user_nickname"] = item.user.nickname if item.user else "알 수 없음"
        results.append(item_dict)
    return results

@router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    admin: models.User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    item = db.query(models.Buleum).filter(models.Buleum.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    
    db.delete(item)
    db.commit()
    return {"message": "게시글이 삭제되었습니다."}
