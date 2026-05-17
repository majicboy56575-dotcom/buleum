import sys
import os

# Add the current directory to sys.path to import backend modules
sys.path.append(os.getcwd())

from database import engine
import models

def create_missing_tables():
    print("Checking and creating missing tables...")
    try:
        # This will only create tables that do not exist
        models.Base.metadata.create_all(bind=engine)
        print("Tables checked/created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    create_missing_tables()
