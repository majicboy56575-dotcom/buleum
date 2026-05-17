import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import inspect
from database import engine
import models

def check_db():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Tables in DB: {tables}")
        
        required_tables = ["users", "buleums", "town_posts", "experts", "chat_rooms", "chat_messages", "notifications", "payments", "reviews", "verifications"]
        missing = [t for t in required_tables if t not in tables]
        
        if missing:
            print(f"Missing tables: {missing}. Creating them...")
            models.Base.metadata.create_all(bind=engine)
            print("Tables created.")
        else:
            print("All tables exist.")
            
    except Exception as e:
        print(f"Error checking DB: {e}")

if __name__ == "__main__":
    check_db()
