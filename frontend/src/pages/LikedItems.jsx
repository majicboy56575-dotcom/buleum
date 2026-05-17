import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { BACKEND_URL } from '../api/axios';
import './Items.css'; // Reuse item styles

const LikedItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedItems = async () => {
      try {
        const response = await api.get('/items/liked');
        setItems(response.data);
      } catch (error) {
        console.error('Error fetching liked items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLikedItems();
  }, []);

  if (loading) return <div className="loading-spinner">로딩 중...</div>;

  return (
    <div className="items-page">
      <div className="items-container">
        <div className="items-header">
          <h1 className="page-title">나의 관심 목록</h1>
        </div>

        {items.length === 0 ? (
          <div className="no-items">
            <p>관심 목록이 비어 있습니다.</p>
            <span>마음에 드는 부름 요청에 관심을 눌러보세요!</span>
            <br />
            <Link to="/items" className="write-btn" style={{ display: 'inline-flex', marginTop: '20px' }}>부름 보러가기</Link>
          </div>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <Link to={`/items/${item.id}`} key={item.id} className="item-list-card">
                <div className="item-list-image-wrapper">
                  <img src={item.image_url ? `${BACKEND_URL}${item.image_url}` : 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=500'} alt={item.title} className="item-card-image" />
                </div>
                <div className="item-list-content">
                  <h3 className="item-list-title">{item.title}</h3>
                  <div className="item-list-price">{item.price.toLocaleString()}원</div>
                  <div className="item-list-location">{item.location}</div>
                  <div className="item-list-status" data-status={item.status}>
                    {item.status === '완료' ? '완료' : '대기중'}
                  </div>
                  <div className="item-list-footer">
                    <span>관심 {item.likes || 0}</span>
                    <span>&bull;</span>
                    <span>채팅 {item.chats || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedItems;
