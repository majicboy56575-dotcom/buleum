import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [nickname, setNickname] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      setNickname(localStorage.getItem('nickname'));
    };
    checkAuth();
    window.addEventListener('authChange', checkAuth);
    return () => window.removeEventListener('authChange', checkAuth);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-profile-nav')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('nickname');
    localStorage.removeItem('token');
    setNickname(null);
    window.dispatchEvent(new Event('authChange'));
    alert('로그아웃 되었습니다.');
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/items?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <span className="logo-text">부름</span>
          </Link>
          <nav className="header-nav">
            <Link to="/items" className="nav-item">부름이 필요해요</Link>
            <Link to="/town" className="nav-item">동네생활</Link>
            <Link to="/experts" className="nav-item">전문가 찾기</Link>
          </nav>
        </div>
        
        <div className="header-right">
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="물품이나 동네를 검색해보세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-submit">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </form>
          {nickname ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Link to="/notifications" className="auth-icon-btn" title="알림" style={{ position: 'relative' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', backgroundColor: '#FF5252', borderRadius: '50%' }}></span>
              </Link>
              <div className="user-profile-nav" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '10px', marginRight: '10px' }}>
                <button 
                  className="user-nickname-btn" 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {nickname}님
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="profile-dropdown-menu">
                    <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>프로필</Link>
                    <Link to="/requests" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>부름 요청 목록</Link>
                    <Link to="/progress" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>부름 진행 목록</Link>
                    <Link to="/verify" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>신원 인증</Link>
                    <Link to="/profile/liked" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>나의 관심 목록</Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={() => { setIsDropdownOpen(false); handleLogout(); }} className="dropdown-item logout-dropdown-btn">로그아웃</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="auth-icon-btn" title="로그인">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
              </Link>
              <Link to="/signup" className="auth-icon-btn" title="회원가입">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              </Link>
            </>
          )}
          <Link to={nickname ? "/chat" : "/login"} className="chat-btn">채팅하기</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
