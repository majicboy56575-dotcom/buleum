import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { BACKEND_URL } from '../api/axios';
import './ItemDetail.css';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };
    checkAuth();
    window.addEventListener('authChange', checkAuth);
    return () => window.removeEventListener('authChange', checkAuth);
  }, []);

  const fetchItemDetail = async () => {
    try {
      window.scrollTo(0, 0);
      const [itemRes, allItemsRes] = await Promise.all([
        api.get(`/items/${id}`),
        api.get('/items')
      ]);
      setItem(itemRes.data);
      setAllItems(allItemsRes.data);
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemDetail();
  }, [id]);

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요한 서비스입니다.');
      return;
    }
    try {
      const response = await api.post(`/items/${id}/like`);
      setItem(prev => ({ ...prev, likes: response.data.likes }));
    } catch (error) {
      console.error('Error liking item:', error);
    }
  };

  const handleChat = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await api.post('/chats/rooms', {
        buleum_id: parseInt(id)
      });
      navigate('/chat', { state: { roomId: response.data.id } });
    } catch (error) {
      console.error('Error creating chat room:', error);
      alert('채팅방을 생성하는 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = () => {
    navigate('/items/write', { state: { editItem: item } });
  };

  const handleDelete = async () => {
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      try {
        await api.delete(`/items/${id}`);
        alert('게시글이 삭제되었습니다.');
        navigate('/items');
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleComplete = async () => {
    if (window.confirm('심부름을 완료 처리하시겠습니까? 완료된 항목은 목록에서 제외할 수 있습니다.')) {
      try {
        await api.put(`/items/${id}/status`, { status: '완료' });
        alert('완료 처리되었습니다.');
        fetchItemDetail();
      } catch (error) {
        console.error('Error completing item:', error);
        alert('처리 중 오류가 발생했습니다.');
      }
    }
  };

  if (loading) return <div className="loading-spinner">로딩 중...</div>;
  if (!item) return <div className="no-item">상품을 찾을 수 없습니다.</div>;

  return (
    <div className="item-detail-page">
      <div className="detail-container">
        {item.image_url && (
          <div className="image-slider">
            <img 
              src={item.image_url.startsWith('http') ? item.image_url : `${BACKEND_URL}${item.image_url}`}
              alt={item.title} 
              className="detail-image" 
            />
          </div>
        )}

        <div className="seller-profile">
          <div className="seller-avatar">
            <div className="avatar-placeholder">
              {(item.user_nickname || '익')[0]}
            </div>
          </div>
          <div className="seller-info">
            <div className="seller-nickname">{item.user_nickname || '익명의 당근'}</div>
            <div className="seller-location">{item.location}</div>
          </div>
          <div className="manner-temp">
            <span className="temp-number">36.5&deg;C</span>
            <div className="temp-bar-bg">
              <div className="temp-bar-fill" style={{ width: '36.5%' }}></div>
            </div>
            <span className="temp-label">매너온도</span>
          </div>
        </div>

        <div className="item-content">
          <h1 className="item-title">{item.title}</h1>
          <div className="item-meta">
            <span>기타</span>
            <span>&bull;</span>
            <span>끌올 1분 전</span>
          </div>
          <div className="item-price">{item.price.toLocaleString()}원</div>
          <p className="item-description">{item.description}</p>
          <div className="item-stats">
            <span>관심 {item.likes || 0}</span>
            <span>&bull;</span>
            <span>채팅 {item.chats || 0}</span>
            <span>&bull;</span>
            <span>조회 100</span>
          </div>
        </div>

        <div className="related-items-section">
          <div className="related-items-header">
            <h2 className="related-items-title">부름이 필요해요</h2>
            <Link to="/items" className="related-more-link">더보기 &gt;</Link>
          </div>
          <div className="item-grid">
            {allItems.filter(i => i.id !== parseInt(id)).slice(0, 6).map((i) => (
              <Link to={`/items/${i.id}`} key={i.id} className="item-card">
                <div className="item-image-wrapper">
                  {i.image_url && <img src={`${BACKEND_URL}${i.image_url}`} alt={i.title} className="item-card-image" />}
                </div>
                <div className="item-card-content">
                  <h3 className="item-card-title">{i.title}</h3>
                  <div className="item-card-price">{i.price.toLocaleString()}원</div>
                  <div className="item-card-meta">
                    <span>{i.location}</span>
                    <span>&bull;</span>
                    <span>관심 {i.likes || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="detail-action-bar">
          <button className="like-action-btn" onClick={handleLike}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={item.likes > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
          <div className="action-price-info">
            <div className="action-price">{item.price.toLocaleString()}원</div>
            <div className="price-negotiable">가격 제안 불가</div>
          </div>
          <div className="action-right">
            {isLoggedIn && localStorage.getItem('userId') == item.user_id ? (
              <div className="author-actions">
                {item.status !== '완료' && (
                  <button className="complete-btn" onClick={handleComplete}>완료하기</button>
                )}
                <button className="edit-btn" onClick={handleEdit}>수정하기</button>
                <button className="delete-btn" onClick={handleDelete}>삭제하기</button>
              </div>
            ) : (
              <div className="visitor-actions">
                {/* <button 
                  className={`action-payment-btn ${item.status === '완료' ? 'disabled' : ''}`}
                  onClick={() => item.status !== '완료' && navigate(`/payments/deposit/${id}`)}
                  disabled={item.status === '완료'}
                >
                  안전결제
                </button> */}
                <button 
                  className={`action-chat-btn ${item.status === '완료' ? 'disabled' : ''}`} 
                  onClick={handleChat}
                  disabled={item.status === '완료'}
                >
                  {item.status === '완료' ? '완료된 심부름' : '채팅하기'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
