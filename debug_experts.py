import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from schemas import ExpertResponse

def test_experts():
    db = SessionLocal()
    try:
        experts = db.query(models.Expert).all()
        print(f"Total experts in DB: {len(experts)}")
        for exp in experts:
            try:
                # Test mapping to dictionary like in others.py
                data = {
                    "id": exp.id,
                    "user_id": exp.user_id,
                    "category": exp.category,
                    "rating": float(exp.rating) if exp.rating is not None else 0.0,
                    "review_count": int(exp.review_count) if exp.review_count is not None else 0,
                    "description": exp.description,
                    "nickname": exp.user.nickname if exp.user else "알 수 없음",
                    "profile_image_url": exp.user.profile_image_url if exp.user else None
                }
                # Test Pydantic validation
                ExpertResponse(**data)
                print(f"Expert {exp.id}: OK")
            except Exception as item_error:
                print(f"Expert {exp.id}: FAILED - {item_error}")
    except Exception as e:
        print(f"Global Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_experts()
