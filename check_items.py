import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.orm import Session
from database import SessionLocal
import models
from datetime import datetime

def check_items():
    db = SessionLocal()
    try:
        items = db.query(models.Buleum).all()
        print(f"Total items: {len(items)}")
        for item in items:
            print(f"Item {item.id}: {item.title}")
            # Fix missing created_at if any
            if item.created_at is None:
                item.created_at = datetime.utcnow()
                db.commit()
                print(f"Fixed created_at for item {item.id}")
    except Exception as e:
        print(f"Error checking items: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_items()
