"""
이메일 인증용 컬럼 마이그레이션 스크립트
User 테이블에 verification_token, verification_token_expires 컬럼을 추가합니다.
"""
import sqlite3

DB_PATH = "buleum.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 기존 컬럼 목록 확인
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "verification_token" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN verification_token TEXT")
        print("[OK] verification_token column added")
    else:
        print("[INFO] verification_token column already exists")
    
    if "verification_token_expires" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN verification_token_expires DATETIME")
        print("[OK] verification_token_expires column added")
    else:
        print("[INFO] verification_token_expires column already exists")
    
    conn.commit()
    conn.close()
    print("\nMigration complete!")

if __name__ == "__main__":
    migrate()
