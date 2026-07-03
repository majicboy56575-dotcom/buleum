import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { BACKEND_URL } from '../api/axios';
import './Requests.css';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/users/me/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleComplete = async (itemId) => {
    try {
      await api.put(`/items/${itemId}/status`, { status: '완료' });
      alert('완료 처리되었습니다.');
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="requests-page">
      <div className="requests-container">
        <h1 className="page-title">내 부름 요청 목록</h1>
        <p className="page-subtitle">내가 도움을 요청한 내역입니다.</p>
        
        {loading ? (
          <div className="loading-spinner">로딩 중...</div>
        ) : requests.length === 0 ? (
          <div className="no-data">
            <p>요청한 부름이 없습니다.</p>
            <Link to="/items/write" className="btn btn-primary">부름 요청하기</Link>
          </div>
        ) : (
          <div className="list-grid">
            {requests.map(req => (
              <div key={req.id} className="list-card">
                <div className="list-image-wrapper">
                  {req.image_url && <img src={`${BACKEND_URL}${req.image_url}`} alt={req.title} />}
                </div>
                <div className="list-content">
                  <div className="list-header">
                    <span className="status-badge" data-status={req.status}>{req.status}</span>
                    <span className="date-text">{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="list-title">{req.title}</h3>
                  <div className="list-price">{req.price.toLocaleString()}원</div>
                  <div className="list-location">{req.location}</div>
                  <div className="list-actions">
                    <Link to={`/items/${req.id}`} className="action-btn outline">상세보기</Link>
                    {req.status === '진행중' && (
                      <button 
                        className="action-btn primary" 
                        onClick={() => handleComplete(req.id)}
                      >
                        완료 처리
                      </button>
                    )}
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

export default Requests;
