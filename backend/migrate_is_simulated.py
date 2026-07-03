import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "buleum.db")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
cols = [r[1] for r in c.execute("PRAGMA table_info(users)").fetchall()]
print("현재 users 테이블 컬럼:", cols)

if "is_simulated" not in cols:
    c.execute("ALTER TABLE users ADD COLUMN is_simulated BOOLEAN DEFAULT 0")
    print("[OK] is_simulated 컬럼이 성공적으로 추가되었습니다.")
else:
    print("[INFO] is_simulated 컬럼이 이미 존재합니다. 건너뜁니다.")

conn.commit()
cols2 = [r[1] for r in c.execute("PRAGMA table_info(users)").fetchall()]
print("마이그레이션 후 users 테이블 컬럼:", cols2)
conn.close()
print("마이그레이션 완료.")
