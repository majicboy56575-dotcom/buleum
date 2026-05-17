import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api, { BACKEND_URL } from '../api/axios';
import './Chat.css';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [payment, setPayment] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  // 미디어 업로드 관련 state
  const [mediaPreview, setMediaPreview] = useState(null); // { file, url, type }
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState(null); // 클릭한 이미지/동영상 URL

  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/chats/rooms');
        setRooms(response.data);
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (rooms.length === 0) return;

    const passedRoomId = location.state?.roomId;
    if (passedRoomId) {
      const room = rooms.find(r => parseInt(r.id) === parseInt(passedRoomId));
      if (room) {
        setActiveRoom(room);
        window.history.replaceState({}, document.title);
      }
    } else if (!activeRoom) {
      setActiveRoom(rooms[0]);
    }
  }, [location.state, rooms]);

  useEffect(() => {
    if (!activeRoom) return;

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/chats/rooms/${activeRoom.id}/messages`);
        const formatted = response.data.map(msg => ({
          id: msg.id,
          sender: msg.sender_id === parseInt(localStorage.getItem('userId')) ? 'me' : 'other',
          text: msg.content,
          message_type: msg.message_type || 'text',
          file_url: msg.file_url || null,
        }));
        setMessages(formatted);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();

    const fetchPayment = async () => {
      if (!activeRoom.buleum_id) return;
      try {
        const response = await api.get(`/payments/buleum/${activeRoom.buleum_id}`);
        setPayment(response.data);
      } catch (error) {
        console.error('Error fetching payment:', error);
      }
    };
    fetchPayment();

    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      ws.current.close();
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, cannot connect WebSocket');
      setWsStatus('closed');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socketUrl = `${protocol}://${window.location.host}/ws/chat/${activeRoom.id}?token=${token}`;

    console.log('🔌 Connecting WebSocket:', socketUrl);
    setWsStatus('connecting');

    const connectWebSocket = () => {
      try {
        const socket = new WebSocket(socketUrl);
        ws.current = socket;

        socket.onopen = () => {
          console.log('✅ WebSocket connected, room:', activeRoom.id);
          setWsStatus('open');
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const myUserId = parseInt(localStorage.getItem('userId'));
            const isMe = data.sender_id === myUserId;
            setMessages(prev => [...prev, {
              id: Date.now() + Math.random(),
              sender: isMe ? 'me' : 'other',
              text: data.content,
              message_type: data.message_type || 'text',
              file_url: data.file_url || null,
              timestamp: data.created_at
            }]);
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        socket.onerror = (e) => {
          console.error('WebSocket error:', e);
          setWsStatus('closed');
        };

        socket.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          setWsStatus('closed');
        };
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
        setWsStatus('closed');
      }
    };

    connectWebSocket();

    return () => {
      if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
        ws.current.close();
      }
    };
  }, [activeRoom?.id]);

  // 텍스트 메시지 전송
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!ws.current || wsStatus !== 'open') {
      alert('연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    const payload = JSON.stringify({ content: newMessage, message_type: 'text' });
    ws.current.send(payload);
    setNewMessage('');
  };

  // 파일 선택 핸들러 (미리보기 생성)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    const allAllowed = [...allowedImageTypes, ...allowedVideoTypes];

    if (!allAllowed.includes(file.type)) {
      alert('지원하지 않는 파일 형식입니다.\n(이미지: jpg, png, gif, webp / 동영상: mp4, mov, webm)');
      e.target.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('파일 크기는 최대 50MB까지 허용됩니다.');
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const fileType = allowedImageTypes.includes(file.type) ? 'image' : 'video';
    setMediaPreview({ file, url: previewUrl, type: fileType });
    e.target.value = '';
  };

  // 미리보기 취소
  const handleCancelPreview = () => {
    if (mediaPreview?.url) URL.revokeObjectURL(mediaPreview.url);
    setMediaPreview(null);
  };

  // 미디어 파일 업로드 후 WebSocket으로 메시지 전송
  const handleSendMedia = async () => {
    if (!mediaPreview || !activeRoom) return;

    if (!ws.current || wsStatus !== 'open') {
      alert('연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', mediaPreview.file);

      const response = await api.post(
        `/chats/rooms/${activeRoom.id}/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const { file_url, message_type } = response.data;

      // WebSocket으로 미디어 메시지 브로드캐스트
      const payload = JSON.stringify({
        content: '',
        message_type,
        file_url
      });
      ws.current.send(payload);

      handleCancelPreview();
    } catch (error) {
      console.error('Upload error:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 메시지 버블 렌더링 (텍스트 / 이미지 / 동영상)
  const renderMessageContent = (msg) => {
    if (msg.message_type === 'image' && msg.file_url) {
      const fullUrl = `${BACKEND_URL}${msg.file_url}`;
      return (
        <img
          src={fullUrl}
          alt="전송된 이미지"
          className="chat-media-image"
          onClick={() => setLightboxMedia({ url: fullUrl, type: 'image' })}
        />
      );
    }
    if (msg.message_type === 'video' && msg.file_url) {
      const fullUrl = `${BACKEND_URL}${msg.file_url}`;
      return (
        <video
          src={fullUrl}
          className="chat-media-video"
          controls
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    return <span>{msg.text}</span>;
  };

  if (!activeRoom && rooms.length === 0) {
    return (
      <div className="chat-page">
        <div className="chat-container">
          <div className="no-rooms">
            <p>채팅 내역이 없습니다.</p>
            <Link to="/items" className="btn btn-primary">부름 찾아보기</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Chat Room List */}
        {(!isMobileView || showListOnMobile) && (
          <div className="chat-sidebar">
            <div className="sidebar-header">
              <h2>채팅</h2>
            </div>
            <div className="room-list">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`room-item ${activeRoom?.id === room.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveRoom(room);
                    setMessages([]);
                    handleCancelPreview();
                    if (isMobileView) setShowListOnMobile(false);
                  }}
                >
                  <div className="room-avatar">
                    <div className="avatar-placeholder">{room.other_nickname[0]}</div>
                  </div>
                  <div className="room-info">
                    <div className="room-top">
                      <span className="room-nickname">{room.other_nickname}</span>
                      <span className="room-time">{new Date(room.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="room-bottom">
                      <p className="room-last-message">{room.last_message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Window */}
        {activeRoom && (!isMobileView || !showListOnMobile) && (
          <div className="chat-window">
            <div className="chat-header">
              {isMobileView && (
                <button className="back-btn" onClick={() => setShowListOnMobile(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
              )}
              <span
                className="active-nickname"
                onClick={() => setShowProfileModal(true)}
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                title="프로필 보기"
              >
                {activeRoom.other_nickname}
              </span>
              <span className="active-item-title">{activeRoom.buleum_title}</span>
            </div>

            {/* Payment Status Bar - Hidden for now */}
            {/* {activeRoom.buleum_id && ( ... )} */}

            <div className="message-list">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-item ${msg.sender}`}>
                  <div className={`message-bubble ${msg.message_type !== 'text' ? 'media-bubble' : ''}`}>
                    {renderMessageContent(msg)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 미디어 미리보기 영역 */}
            {mediaPreview && (
              <div className="media-preview-bar">
                <div className="media-preview-content">
                  {mediaPreview.type === 'image' ? (
                    <img src={mediaPreview.url} alt="미리보기" className="media-preview-thumb" />
                  ) : (
                    <video src={mediaPreview.url} className="media-preview-thumb" muted />
                  )}
                  <span className="media-preview-name">{mediaPreview.file.name}</span>
                </div>
                <div className="media-preview-actions">
                  <button
                    className="btn-send-media"
                    onClick={handleSendMedia}
                    disabled={isUploading || wsStatus !== 'open'}
                  >
                    {isUploading ? (
                      <span className="uploading-indicator">
                        <span className="spinner"></span> 업로드 중...
                      </span>
                    ) : '전송'}
                  </button>
                  <button
                    className="btn-cancel-media"
                    onClick={handleCancelPreview}
                    disabled={isUploading}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              {wsStatus !== 'open' && (
                <div className="ws-status">
                  {wsStatus === 'connecting' ? '⏳ 연결 중...' : '🔴 연결 끊김 - 새로고침 해주세요'}
                </div>
              )}
              <div className="chat-input-row">
                {/* 파일 업로드 버튼 */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="btn-attach"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={wsStatus !== 'open' || isUploading}
                  title="사진/동영상 첨부"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </button>

                <input
                  type="text"
                  placeholder={wsStatus === 'open' ? '메시지를 입력하세요...' : '연결 대기 중...'}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="chat-input"
                  disabled={wsStatus !== 'open'}
                />
                <button type="submit" className="send-btn" disabled={wsStatus !== 'open'}>
                  {wsStatus === 'open' ? '전송' : '대기'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && activeRoom && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>상대방 프로필</h3>
              <button className="close-modal-btn" onClick={() => setShowProfileModal(false)}>&times;</button>
            </div>
            <div className="profile-modal-body">
              <div className="profile-avatar-large">
                <div className="avatar-placeholder">{activeRoom.other_nickname[0]}</div>
              </div>
              <h2 className="profile-nickname">{activeRoom.other_nickname}</h2>
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-label">매너온도</span>
                  <span className="stat-value" style={{ color: 'var(--primary-color)' }}>36.5°C</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">활동 동네</span>
                  <span className="stat-value">역삼동</span>
                </div>
              </div>
              <button
                style={{ width: '100%', marginTop: '20px', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => setShowProfileModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지/동영상 라이트박스 */}
      {lightboxMedia && (
        <div className="lightbox-overlay" onClick={() => setLightboxMedia(null)}>
          <button className="lightbox-close" onClick={() => setLightboxMedia(null)}>&times;</button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            {lightboxMedia.type === 'image' ? (
              <img src={lightboxMedia.url} alt="원본 이미지" className="lightbox-image" />
            ) : (
              <video src={lightboxMedia.url} className="lightbox-video" controls autoPlay />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
