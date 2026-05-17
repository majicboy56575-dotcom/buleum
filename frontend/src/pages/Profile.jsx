import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('010-1234-5678');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me');
        setNickname(response.data.nickname);
        setLocation(response.data.location);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/me', { nickname, location });
      localStorage.setItem('nickname', nickname);
      window.dispatchEvent(new Event('authChange'));
      alert('프로필 정보가 성공적으로 수정되었습니다!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div className="loading-spinner">로딩 중...</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1 className="page-title">프로필 수정</h1>
        
        <div className="profile-header">
          <div className="profile-avatar-large">
            <div className="avatar-placeholder">{nickname ? nickname[0] : 'U'}</div>
          </div>
          <button className="change-avatar-btn">사진 변경</button>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <div className="form-group">
            <label>닉네임</label>
            <input 
              type="text" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)}
              className="profile-input"
            />
          </div>

          <div className="form-group">
            <label>휴대폰 번호</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="profile-input"
            />
          </div>

          <div className="form-group">
            <label>내 동네</label>
            <input 
              type="text" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              className="profile-input"
            />
          </div>

          <div className="profile-actions">
            <button type="submit" className="save-btn">저장하기</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
