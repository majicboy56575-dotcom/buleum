import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (noti) => {
    console.log('Notification clicked:', noti);

    // 1. Mark as read in backend
    if (!noti.is_read) {
      try {
        await api.patch(`/notifications/${noti.id}/read`);
        setNotifications(notifications.map(n => 
          n.id === noti.id ? { ...n, is_read: true } : n
        ));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // 2. Navigate to relevant page
    if (noti.type === 'chat' && noti.related_id) {
      console.log('Navigating to chat with roomId:', noti.related_id);
      // Ensure it's a number
      const roomId = parseInt(noti.related_id);
      navigate('/chat', { state: { roomId: roomId } });
    } else if ((noti.type === 'accept' || noti.type === 'comment') && noti.related_id) {
      console.log('Navigating to item:', noti.related_id);
      navigate(`/items/${noti.related_id}`);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <h1 className="page-title">알림</h1>
        
        <div className="notification-list">
          {loading ? (
            <div className="loading-spinner">로딩 중...</div>
          ) : notifications.length === 0 ? (
            <div className="no-data">새로운 알림이 없습니다.</div>
          ) : (
            notifications.map(noti => (
              <div 
                key={noti.id} 
                className={`notification-item ${noti.is_read ? 'read' : 'unread'}`}
                onClick={() => handleNotificationClick(noti)}
                style={{ cursor: 'pointer' }}
              >
                <div className="noti-icon">
                  {noti.type === 'chat' && <span role="img" aria-label="chat">💬</span>}
                  {noti.type === 'accept' && <span role="img" aria-label="accept">🤝</span>}
                  {noti.type === 'comment' && <span role="img" aria-label="comment">📝</span>}
                  {noti.type === 'review' && <span role="img" aria-label="review">⭐</span>}
                </div>
                <div className="noti-content-wrap">
                  <p className="noti-content">{noti.content}</p>
                  <span className="noti-time">{new Date(noti.created_at).toLocaleString()}</span>
                </div>
                {!noti.is_read && <div className="unread-dot"></div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
