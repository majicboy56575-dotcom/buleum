import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "buleum.db")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
cols = [r[1] for r in c.execute("PRAGMA table_info(chat_messages)").fetchall()]
print("Before:", cols)

if "message_type" not in cols:
    c.execute("ALTER TABLE chat_messages ADD COLUMN message_type TEXT DEFAULT 'text'")
    print("Added message_type")

if "file_url" not in cols:
    c.execute("ALTER TABLE chat_messages ADD COLUMN file_url TEXT")
    print("Added file_url")

conn.commit()
cols2 = [r[1] for r in c.execute("PRAGMA table_info(chat_messages)").fetchall()]
print("After:", cols2)
conn.close()
print("Migration done.")
