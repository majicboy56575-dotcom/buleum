import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { BACKEND_URL } from '../api/axios';
import './Town.css';

const Town = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('전체');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const categories = ['전체', '동네질문', '동네맛집', '일상', '동네소식'];

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };
    checkAuth();
    window.addEventListener('authChange', checkAuth);
    return () => window.removeEventListener('authChange', checkAuth);
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const url = activeTab === '전체' ? '/town/posts' : `/town/posts?category=${encodeURIComponent(activeTab)}`;
      const response = await api.get(url);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching town posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  return (
    <div className="town-page">
      <div className="town-container">
        <div className="town-header">
          <h1 className="page-title">동네생활</h1>
          <button className="town-write-btn" onClick={() => isLoggedIn ? navigate('/town/write') : navigate('/login')}>글쓰기</button>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`tab ${activeTab === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Post List */}
        <div className="post-list">
          {loading ? (
            <div className="loading-spinner">로딩 중...</div>
          ) : posts.length === 0 ? (
            <div className="no-data">게시글이 없습니다.</div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="post-card">
                <span className="post-category">{post.category}</span>
                <p className="post-content">{post.content}</p>
                {post.image_url && (
                  <div className="post-image-wrapper">
                    <img src={`${BACKEND_URL}${post.image_url}`} alt="Post" className="post-image" />
                  </div>
                )}
                <div className="post-meta">
                  <span className="post-author">익명</span>
                  <span>&bull;</span>
                  <span className="post-location">{post.location}</span>
                  <span>&bull;</span>
                  <span className="post-time">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <div className="post-footer">
                  <button className="post-action-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                    공감 {post.likes || 0}
                  </button>
                  <button className="post-action-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    댓글 {post.comments || 0}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Town;
