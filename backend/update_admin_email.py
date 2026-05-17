import sys
import os
sys.path.append(os.getcwd())

from database import SessionLocal
import models

def update_admin():
    db = SessionLocal()
    try:
        # 1. Old admin account exists? Update it.
        old_admin = db.query(models.User).filter(models.User.email == "admin").first()
        if old_admin:
            old_admin.email = "admin@gmail.com"
            db.commit()
            print("Successfully updated admin email to admin@gmail.com")
        else:
            print("Old admin account not found or already updated.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_admin()
