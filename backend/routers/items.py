from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import uuid

import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/items", tags=["items"])

# Helper function to save file
def save_upload_file(upload_file: UploadFile, destination: str):
    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        upload_file.file.close()

@router.get("", response_model=List[schemas.ItemResponse])
def get_items(search: Optional[str] = None, location: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Buleum)
    if search:
        query = query.filter(models.Buleum.title.contains(search) | models.Buleum.description.contains(search))
    if location:
        query = query.filter(models.Buleum.location == location)
    
    from sqlalchemy.orm import joinedload
    items = query.options(joinedload(models.Buleum.user)).order_by(models.Buleum.created_at.desc()).all()
    
    results = []
    for item in items:
        item_dict = {c.name: getattr(item, c.name) for c in item.__table__.columns}
        item_dict["user_nickname"] = item.user.nickname if item.user else "알 수 없음"
        results.append(item_dict)
    return results

@router.post("", response_model=schemas.ItemResponse)
def create_item(
    title: str = Form(...),
    price: int = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    image_url = None
    if image:
        os.makedirs("uploads", exist_ok=True)
        filename = f"{uuid.uuid4()}_{image.filename}"
        filepath = os.path.join("uploads", filename)
        save_upload_file(image, filepath)
        image_url = f"/uploads/{filename}"

    db_item = models.Buleum(
        user_id=current_user.id,
        title=title,
        price=price,
        description=description,
        location=location,
        image_url=image_url
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    item_dict = {c.name: getattr(db_item, c.name) for c in db_item.__table__.columns}
    item_dict["user_nickname"] = current_user.nickname
    return item_dict

@router.get("/{item_id}", response_model=schemas.ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    item = db.query(models.Buleum).options(joinedload(models.Buleum.user)).filter(models.Buleum.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item_dict = {c.name: getattr(item, c.name) for c in item.__table__.columns}
    item_dict["user_nickname"] = item.user.nickname if item.user else "알 수 없음"
    return item_dict

@router.put("/{item_id}/status", response_model=schemas.ItemResponse)
def update_item_status(
    item_id: int, 
    status_update: schemas.ItemStatusUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(models.Buleum).filter(models.Buleum.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this item")
        
    item.status = status_update.status
    db.commit()
    db.refresh(item)
    return item

@router.get("/liked", response_model=List[schemas.ItemResponse])
def get_liked_items(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Find all buleum IDs liked by the current user
    liked_ids = db.query(models.UserItemLike.buleum_id).filter(models.UserItemLike.user_id == current_user.id).all()
    liked_ids = [lid[0] for lid in liked_ids]
    
    if not liked_ids:
        return []
        
    from sqlalchemy.orm import joinedload
    items = db.query(models.Buleum).options(joinedload(models.Buleum.user)).filter(models.Buleum.id.in_(liked_ids)).order_by(models.Buleum.created_at.desc()).all()
    
    results = []
    for item in items:
        item_dict = {c.name: getattr(item, c.name) for c in item.__table__.columns}
        item_dict["user_nickname"] = item.user.nickname if item.user else "알 수 없음"
        results.append(item_dict)
    return results

@router.post("/{item_id}/like", response_model=schemas.ItemResponse)
def toggle_item_like(item_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    item = db.query(models.Buleum).filter(models.Buleum.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if already liked
    existing_like = db.query(models.UserItemLike).filter(
        models.UserItemLike.user_id == current_user.id,
        models.UserItemLike.buleum_id == item_id
    ).first()
    
    if existing_like:
        # Unlike
        db.delete(existing_like)
        item.likes = max(0, item.likes - 1)
        message = "Unliked"
    else:
        # Like
        new_like = models.UserItemLike(user_id=current_user.id, buleum_id=item_id)
        db.add(new_like)
        item.likes += 1
        message = "Liked"
        
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=schemas.ItemResponse)
def update_item(
    item_id: int,
    title: str = Form(...),
    price: int = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(models.Buleum).filter(models.Buleum.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this item")
        
    item.title = title
    item.price = price
    item.description = description
    item.location = location
    
    if image:
        os.makedirs("uploads", exist_ok=True)
        filename = f"{uuid.uuid4()}_{image.filename}"
        filepath = os.path.join("uploads", filename)
        save_upload_file(image, filepath)
        item.image_url = f"/uploads/{filename}"
        
    db.commit()
    db.refresh(item)
    
    item_dict = {c.name: getattr(item, c.name) for c in item.__table__.columns}
    item_dict["user_nickname"] = current_user.nickname
    return item_dict

@router.delete("/{item_id}")
def delete_item(
    item_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(models.Buleum).filter(models.Buleum.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")
    
    # NEW DELETION POLICY:
    # 1. Chat: Keep rooms and messages, but notify that the item is deleted.
    chat_rooms = db.query(models.ChatRoom).filter(models.ChatRoom.buleum_id == item_id).all()
    for room in chat_rooms:
        # Add a system message
        new_msg = models.ChatMessage(
            room_id=room.id,
            sender_id=current_user.id, # Using author as sender for the "deleted" message
            content="[시스템] 해당 게시글은 삭제되었습니다."
        )
        db.add(new_msg)
        # Detach room from item
        room.buleum_id = None
    
    # 2. Review: Delete associated reviews as requested
    db.query(models.Review).filter(models.Review.buleum_id == item_id).delete(synchronize_session=False)

    # 3. Payment: Keep if completed (status == "지급완료"), otherwise detach or delete?
    # User said: "결재가 완료된 상태에서는 결재 관련 내용은 삭제하지 말아주세요"
    # So we just detach all payments for simplicity, or only completed ones. 
    # Let's detach all to be safe and keep the history.
    payments = db.query(models.Payment).filter(models.Payment.buleum_id == item_id).all()
    for payment in payments:
        payment.buleum_id = None
        
    # 4. Item: Delete the item itself
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}
