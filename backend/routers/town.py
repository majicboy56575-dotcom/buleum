from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import shutil

import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/town", tags=["town"])

def save_upload_file(upload_file: UploadFile, destination: str):
    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        upload_file.file.close()

@router.get("/posts", response_model=List[schemas.TownPostResponse])
def get_town_posts(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.TownPost)
    if category:
        query = query.filter(models.TownPost.category == category)
    
    posts = query.order_by(models.TownPost.created_at.desc()).all()
    return posts

@router.post("/posts", response_model=schemas.TownPostResponse)
def create_town_post(
    category: str = Form(...),
    content: str = Form(...),
    location: str = Form("역삼동"), # Defaulting for simplicity
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
        image_url = f"http://127.0.0.1:8000/uploads/{filename}"

    db_post = models.TownPost(
        user_id=current_user.id,
        category=category,
        content=content,
        location=location,
        image_url=image_url
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post
