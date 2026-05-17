import sqlite3
import os

db_path = "buleum.db"

def fix_db():
    if not os.path.exists(db_path):
        print("Database not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Add is_admin column if it doesn't exist
        print("Checking for is_admin column...")
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "is_admin" not in columns:
            print("Adding is_admin column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
            print("Column added.")
        else:
            print("is_admin column already exists.")

        # 2. Update existing admin or create one
        print("Updating admin email to admin@gmail.com...")
        # Check if 'admin' exists
        cursor.execute("SELECT id FROM users WHERE email = 'admin'")
        row = cursor.fetchone()
        if row:
            cursor.execute("UPDATE users SET email = 'admin@gmail.com', is_admin = 1 WHERE email = 'admin'")
            print("Updated existing admin account.")
        else:
            # Check if admin@gmail.com exists
            cursor.execute("SELECT id FROM users WHERE email = 'admin@gmail.com'")
            if not cursor.fetchone():
                print("Admin account doesn't exist yet. It will be created when the server starts.")
            else:
                cursor.execute("UPDATE users SET is_admin = 1 WHERE email = 'admin@gmail.com'")
                print("Ensured admin@gmail.com has admin privileges.")

        conn.commit()
        print("Database fixed successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_db()
