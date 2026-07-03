import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { BACKEND_URL } from '../api/axios';
import './Requests.css'; // Reuse the same CSS as Requests

const Progress = () => {
  const [progressItems, setProgressItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await api.get('/users/me/progress');
        setProgressItems(response.data);
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  return (
    <div className="requests-page">
      <div className="requests-container">
        <h1 className="page-title">내 부름 진행 목록</h1>
        <p className="page-subtitle">내가 도움을 제공하고 있는 내역입니다.</p>
        
        {loading ? (
          <div className="loading-spinner">로딩 중...</div>
        ) : progressItems.length === 0 ? (
          <div className="no-data">
            <p>진행 중인 부름이 없습니다.</p>
            <Link to="/items" className="btn btn-primary">도움이 필요한 곳 찾기</Link>
          </div>
        ) : (
          <div className="list-grid">
            {progressItems.map(item => (
              <div key={item.id} className="list-card">
                <div className="list-image-wrapper">
                  {item.image_url && <img src={`${BACKEND_URL}${item.image_url}`} alt={item.title} />}
                </div>
                <div className="list-content">
                  <div className="list-header">
                    <span className="status-badge" data-status={item.status}>{item.status}</span>
                    <span className="date-text">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="list-title">{item.title}</h3>
                  <div className="list-price">{item.price.toLocaleString()}원</div>
                  <div className="list-location">{item.location}</div>
                  <div className="list-actions">
                    <Link to={`/items/${item.id}`} className="action-btn outline">상세보기</Link>
                    <Link to="/chat" className="action-btn primary">채팅하기</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;
