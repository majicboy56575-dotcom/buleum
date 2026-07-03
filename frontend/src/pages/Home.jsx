import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { BACKEND_URL } from '../api/axios';
import './Home.css';

const Home = () => {
  const [items, setItems] = useState([]);
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

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get('/items');
        setItems(response.data);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">효도대행 서비스<br />부름</h1>
          <p className="hero-subtitle">부모님을 위한 따뜻한 동행, 지금 부름과 함께하세요.</p>
          <div className="hero-buttons">
            <Link to="/items" className="btn btn-primary">부름이 필요해요</Link>
            {!isLoggedIn && (
              <>
                <Link to="/login" className="btn btn-secondary">로그인</Link>
                <Link to="/signup" className="btn btn-secondary">회원가입</Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-image-container">
          <img src="/hero-image.png" alt="효도대행 서비스 부름" className="hero-image" />
        </div>
      </section>

      {/* Service Shortcuts Section */}
      <section className="services-section">
        <div className="services-grid">
          <Link to="/items" className="service-item">
            <div className="service-icon icon-orange">🛒</div>
            <span className="service-name">부름이 필요해요</span>
          </Link>
          <Link to="/town" className="service-item">
            <div className="service-icon icon-green">🏡</div>
            <span className="service-name">동네생활</span>
          </Link>
          <Link to="/experts" className="service-item">
            <div className="service-icon icon-blue">🧑‍💼</div>
            <span className="service-name">전문가 찾기</span>
          </Link>
          <Link to={isLoggedIn ? "/chat" : "/login"} className="service-item">
            <div className="service-icon icon-yellow">💬</div>
            <span className="service-name">채팅</span>
          </Link>
        </div>
      </section>

      {/* Popular Items Section */}
      <section className="popular-section">
        <div className="section-header">
          <h2 className="section-title">부름이 필요해요</h2>
          <Link to="/items" className="more-link">더보기 &gt;</Link>
        </div>

        {loading ? (
          <div className="loading-spinner">로딩 중...</div>
        ) : (
          <div className="item-grid">
            {items.slice(0, 4).map((item) => (
              <Link to={`/items/${item.id}`} key={item.id} className="item-card">
                <div className="item-image-wrapper">
                  {item.image_url && (
                    <img 
                      src={item.image_url.startsWith('http') ? item.image_url : `${BACKEND_URL}${item.image_url}`}
                      alt={item.title} 
                      className="item-card-image" 
                    />
                  )}
                </div>
                <div className="item-card-content">
                  <h3 className="item-card-title">{item.title}</h3>
                  <div className="item-card-price">{item.price.toLocaleString()}원</div>
                  <div className="item-card-meta">
                    <span>{item.location}</span>
                    <span>&bull;</span>
                    <span>관심 {item.likes || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
