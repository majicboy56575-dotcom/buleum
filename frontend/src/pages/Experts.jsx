import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Experts.css';

const Experts = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('전체');
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const categories = ['전체', '요양보호사', '간병인', '가사도우미', '청소전문가', '기타'];

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/experts');
        setExperts(response.data);
      } catch (error) {
        console.error('Error fetching experts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();
  }, []);

  const filteredExperts = activeCategory === '전체' 
    ? experts 
    : experts.filter(expert => expert.category === activeCategory);

  return (
    <div className="experts-page">
      <div className="experts-container">
        <div className="experts-header">
          <h1 className="page-title">전문가 찾기</h1>
          <p className="page-subtitle">우리 동네의 검증된 전문가를 만나보세요.</p>
        </div>

        <div className="category-tabs">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="experts-grid">
          {loading ? (
            <div className="loading-spinner">로딩 중...</div>
          ) : filteredExperts.length === 0 ? (
            <div className="no-data">해당 카테고리의 전문가가 없습니다.</div>
          ) : (
            filteredExperts.map(expert => (
              <div key={expert.id} className="expert-card">
                <div className="expert-image">
                  <img src={expert.profile_image_url || 'https://via.placeholder.com/100'} alt={expert.nickname} />
                </div>
                <div className="expert-info">
                  <div className="expert-top">
                    <span className="expert-category">{expert.category}</span>
                    <div className="expert-rating">
                      <span className="star">★</span> {expert.rating.toFixed(1)} ({expert.review_count})
                    </div>
                  </div>
                  <h3 className="expert-name">{expert.nickname}</h3>
                  <p className="expert-desc">{expert.description || '반갑습니다! 우리 동네 전문가입니다.'}</p>
                  <div className="expert-bottom">
                    <span className="expert-location">역삼동</span>
                    <button className="expert-contact-btn" onClick={() => setSelectedExpert(expert)}>프로필 보기</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Expert Profile Modal */}
      {selectedExpert && (
        <div className="expert-modal-overlay" onClick={() => setSelectedExpert(null)}>
          <div className="expert-modal-content" onClick={e => e.stopPropagation()}>
            <div className="expert-modal-header">
              <h3>전문가 프로필</h3>
              <button className="close-modal-btn" onClick={() => setSelectedExpert(null)}>&times;</button>
            </div>
            <div className="expert-modal-body">
              <div className="modal-expert-image">
                <img src={selectedExpert.profile_image_url || 'https://via.placeholder.com/150'} alt={selectedExpert.nickname} />
              </div>
              <div className="modal-expert-info">
                <span className="expert-category">{selectedExpert.category}</span>
                <h2 className="expert-name">{selectedExpert.nickname}</h2>
                <div className="expert-rating">
                  <span className="star">★</span> {selectedExpert.rating.toFixed(1)} ({selectedExpert.review_count}개의 리뷰)
                </div>
                <div className="expert-details">
                  <p><strong>활동 지역:</strong> 역삼동</p>
                  <p><strong>소개:</strong> {selectedExpert.description || '안녕하세요!'}</p>
                  <p><strong>자격 증명:</strong> <span style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>✓ 신원 인증 완료</span></p>
                </div>
              </div>
              <div className="modal-expert-actions">
                <button className="btn btn-outline" onClick={() => setSelectedExpert(null)}>닫기</button>
                <button 
                  className="btn btn-primary" 
                  onClick={async () => {
                    if (!localStorage.getItem('token')) {
                      alert('로그인이 필요한 서비스입니다.');
                      navigate('/login');
                      return;
                    }
                    try {
                      const response = await api.post('/chats/rooms', {
                        helper_id: selectedExpert.user_id
                      });
                      navigate('/chat', { state: { roomId: response.data.id } });
                      setSelectedExpert(null);
                    } catch (error) {
                      console.error('Error creating chat room:', error);
                      alert('채팅방을 생성하는 중 오류가 발생했습니다.');
                    }
                  }}
                >
                  채팅 문의하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Experts;
