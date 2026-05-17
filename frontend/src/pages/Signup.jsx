import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Auth.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    try {
      await api.post('/auth/register', {
        email,
        password,
        nickname,
        location: '역삼동' // default location for now
      });
      alert('회원가입이 완료되었습니다!');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.detail || '회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">부름(Buleum) 회원가입</h1>
        <p className="auth-subtitle">믿을 수 있는 이웃과 따뜻한 도움을 나눠보세요.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">이메일 주소</label>
            <input
              type="email"
              id="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="nickname">닉네임</label>
            <input
              type="text"
              id="nickname"
              placeholder="동네에서 사용할 이름을 적어주세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              placeholder="6자리 이상 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="비밀번호를 한 번 더 입력하세요"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn">회원가입</button>
        </form>

        <div className="auth-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인하기</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
