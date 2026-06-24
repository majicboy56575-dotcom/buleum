import sqlite3
conn = sqlite3.connect('buleum.db')
c = conn.cursor()
c.execute('SELECT id, email, nickname, is_verified, verification_token FROM users')
rows = c.fetchall()
for r in rows:
    token_short = r[4][:20] + '...' if r[4] else 'None'
    print(f'id={r[0]} email={r[1]} nick={r[2]} verified={r[3]} token={token_short}')
conn.close()
