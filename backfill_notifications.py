import sqlite3

def backfill():
    conn = sqlite3.connect('backend/buleum.db')
    cursor = conn.cursor()
    
    # related_id가 없는 채팅 알림 조회
    cursor.execute("SELECT id, user_id, content FROM notifications WHERE type='chat' AND related_id IS NULL")
    notifications = cursor.fetchall()
    
    print(f"Found {len(notifications)} notifications to fix")
    
    count = 0
    for noti_id, user_id, content in notifications:
        try:
            if '님이' in content:
                sender_nickname = content.split('님이')[0]
                
                # 해당 닉네임과의 채팅방 찾기
                query = """
                    SELECT cr.id FROM chat_rooms cr
                    JOIN users u1 ON cr.requester_id = u1.id
                    JOIN users u2 ON cr.helper_id = u2.id
                    WHERE (u1.id = ? AND u2.nickname = ?) OR (u2.id = ? AND u1.nickname = ?)
                """
                cursor.execute(query, (user_id, sender_nickname, user_id, sender_nickname))
                room = cursor.fetchone()
                
                if room:
                    room_id = room[0]
                    cursor.execute("UPDATE notifications SET related_id = ? WHERE id = ?", (room_id, noti_id))
                    count += 1
        except Exception as e:
            print(f"Error on {noti_id}: {e}")
            
    conn.commit()
    conn.close()
    print(f"Successfully updated {count} notifications")

if __name__ == "__main__":
    backfill()
