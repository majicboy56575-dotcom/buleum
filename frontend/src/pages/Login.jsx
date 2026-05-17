import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      
      // Fetch user profile to get nickname and id
      const meResponse = await api.get('/users/me');
      localStorage.setItem('nickname', meResponse.data.nickname);
      localStorage.setItem('userId', meResponse.data.id);
      
      window.dispatchEvent(new Event('authChange'));
      alert(`${meResponse.data.nickname}님, 환영합니다!`);
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.detail || '로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">부름 로그인</h1>
        <p className="auth-subtitle">부름 서비스에 오신 것을 환영합니다.</p>

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
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn">로그인</button>
        </form>

        <div className="auth-footer">
          아직 계정이 없으신가요? <Link to="/signup">회원가입하기</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
