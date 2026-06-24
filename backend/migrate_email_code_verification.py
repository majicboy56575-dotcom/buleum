"""
email_verifications 테이블 마이그레이션 스크립트
6자리 인증코드 기반 이메일 인증을 위한 테이블을 생성합니다.
"""
import sqlite3

conn = sqlite3.connect('buleum.db')
c = conn.cursor()

# email_verifications 테이블 생성
c.execute('''
    CREATE TABLE IF NOT EXISTS email_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
''')

# email 컬럼에 인덱스 추가
c.execute('''
    CREATE INDEX IF NOT EXISTS ix_email_verifications_email 
    ON email_verifications (email)
''')

conn.commit()
conn.close()

print("[OK] email_verifications 테이블이 성공적으로 생성되었습니다.")
