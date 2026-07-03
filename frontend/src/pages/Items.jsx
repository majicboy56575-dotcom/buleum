import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api, { BACKEND_URL } from '../api/axios';
import './Items.css';
import './Town.css';

const mockTownPosts = [
  {
    id: 1,
    category: '동네질문',
    content: '역삼역 근처에 강아지 미용 잘하는 곳 있을까요? 포메라니안인데 가위컷 예쁘게 하는 곳 추천 부탁드립니다!',
    author: '뽀삐엄마',
    location: '역삼동',
    time: '10분 전',
    comments: 5,
    likes: 2
  },
  {
    id: 2,
    category: '동네맛집',
    content: '오늘 새로 오픈한 타코집 가봤는데 진짜 맛있네요. 도미노피자 뒤쪽 골목에 있어요. 강추합니다!',
    author: '타코러버',
    location: '논현동',
    time: '1시간 전',
    comments: 12,
    likes: 8
  },
  {
    id: 3,
    category: '일상',
    content: '날씨가 너무 좋아서 양재천 산책 나왔어요. 벚꽃은 다 졌지만 초록초록하니 걷기 좋네요.',
    author: '산책러',
    location: '양재동',
    time: '2시간 전',
    comments: 3,
    likes: 15
  }
];

const Items = () => {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedCity, setSelectedCity] = useState('전체');
  const [selectedLocations, setSelectedLocations] = useState([]);
  
  const cities = ['전체', '서울시', '부산시', '대구시', '인천시', '광주시', '대전시', '울산시', '세종시', '경기도', '강원도', '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주도'];

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!localStorage.getItem('nickname'));
    };
    checkAuth();
    window.addEventListener('authChange', checkAuth);
    return () => window.removeEventListener('authChange', checkAuth);
  }, []);
  
  // Parse search query from URL
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('search') || '';

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await api.get('/items');
        setAllItems(response.data);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Filter items based on criteria
  let filteredItems = allItems;
  if (searchQuery) {
    filteredItems = filteredItems.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (availableOnly) {
    filteredItems = filteredItems.filter(item => item.status !== '완료');
  }
  if (selectedCity !== '전체') {
    filteredItems = filteredItems.filter(item => item.location && item.location.startsWith(selectedCity));
  }
  if (selectedLocations.length > 0) {
    filteredItems = filteredItems.filter(item => selectedLocations.includes(item.location));
  }

  // Get unique locations from all items for the filter
  const uniqueLocations = [...new Set(allItems.map(i => i.location))].filter(Boolean);

  // Filter town posts based on search query
  let filteredTownPosts = mockTownPosts;
  if (searchQuery) {
    filteredTownPosts = filteredTownPosts.filter(post => 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return (
    <div className="items-page">
      <div className="items-container items-layout-with-sidebar">
        
        {/* Sidebar Filters */}
        <aside className="items-sidebar">
          <div className="filter-section">
            <h3 className="filter-title">지역(시)</h3>
            <select 
              className="filter-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">부름 상태</h3>
            <label className="filter-checkbox">
              <input 
                type="checkbox" 
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
              />
              <span>부름가능만 보기</span>
            </label>
          </div>

          {uniqueLocations.length > 0 && (
            <div className="filter-section">
              <h3 className="filter-title">지역</h3>
              <div className="location-list">
                {uniqueLocations.map(loc => (
                  <label key={loc} className="filter-checkbox">
                    <input 
                      type="checkbox" 
                      checked={selectedLocations.includes(loc)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLocations([...selectedLocations, loc]);
                        } else {
                          setSelectedLocations(selectedLocations.filter(l => l !== loc));
                        }
                      }}
                    />
                    <span>{loc}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="items-main-content">
          <div className="items-header">
            <h1 className="page-title">
              {searchQuery ? `'${searchQuery}' 검색 결과` : '부름이 필요해요'}
            </h1>
            <Link to={isLoggedIn ? "/items/write" : "/login"} className="write-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              글쓰기
            </Link>
          </div>

          {loading ? (
            <div className="loading-spinner">로딩 중...</div>
          ) : filteredItems.length === 0 ? (
            <div className="no-items">
              <p>검색 결과가 없습니다.</p>
              <span>조건을 변경해 보세요.</span>
            </div>
          ) : (
            <div className="items-grid">
              {filteredItems.map((item) => (
                <Link to={`/items/${item.id}`} key={item.id} className="item-list-card">
                  {item.image_url && (
                    <div className="item-list-image-wrapper">
                      <img src={`${BACKEND_URL}${item.image_url}`} alt={item.title} className="item-card-image" />
                    </div>
                  )}
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

          {/* Town Search Results */}
          {searchQuery && filteredTownPosts.length > 0 && (
            <div className="town-search-results" style={{ marginTop: '40px' }}>
              <h2 className="section-title" style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>동네생활 검색 결과</h2>
              <div className="post-list">
                {filteredTownPosts.map((post) => (
                  <div key={post.id} className="post-card">
                    <span className="post-category">{post.category}</span>
                    <p className="post-content">{post.content}</p>
                    <div className="post-meta">
                      <span className="post-author">{post.author}</span>
                      <span>&bull;</span>
                      <span className="post-location">{post.location}</span>
                      <span>&bull;</span>
                      <span className="post-time">{post.time}</span>
                    </div>
                    <div className="post-footer">
                      <button className="post-action-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                        공감 {post.likes}
                      </button>
                      <button className="post-action-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        댓글 {post.comments}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Items;
