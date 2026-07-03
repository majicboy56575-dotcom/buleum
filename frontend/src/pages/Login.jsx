import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showVerifyNotice, setShowVerifyNotice] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowVerifyNotice(false);
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
      const detail = error.response?.data?.detail;
      if (detail === 'EMAIL_NOT_VERIFIED') {
        setShowVerifyNotice(true);
      } else {
        alert(detail || '로그인 중 오류가 발생했습니다.');
      }
    }
  };

  const handleResendVerification = async () => {
    navigate('/signup');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">부름 로그인</h1>
        <p className="auth-subtitle">부름 서비스에 오신 것을 환영합니다.</p>

        {showVerifyNotice && (
          <div className="verify-notice">
            <div className="verify-notice-icon">✉️</div>
            <p className="verify-notice-title">이메일 인증이 필요합니다</p>
            <p className="verify-notice-text">
              회원가입 시 이메일 인증을 완료해주세요. 회원가입 페이지에서 인증번호를 받을 수 있습니다.
            </p>
            <button 
              className="verify-resend-btn"
              onClick={handleResendVerification}
              disabled={resending}
            >
              {resending ? '처리 중...' : '회원가입 페이지로 이동'}
            </button>
          </div>
        )}

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
          <div style={{ marginBottom: '12px' }}>
            <Link to="/forgot-password">비밀번호를 잊으셨나요?</Link>
          </div>
          아직 계정이 없으신가요? <Link to="/signup">회원가입하기</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
