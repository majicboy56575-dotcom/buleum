import sqlite3
conn = sqlite3.connect('buleum.db')
c = conn.cursor()
c.execute('SELECT verification_token FROM users WHERE email = ?', ('majicboy56575@gmail.com',))
row = c.fetchone()
if row and row[0]:
    print(row[0])
else:
    print('NO_TOKEN')
conn.close()
