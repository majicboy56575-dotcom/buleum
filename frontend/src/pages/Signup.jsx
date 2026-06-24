import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Auth.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  // 이메일 인증 상태
  const [verificationStep, setVerificationStep] = useState('idle'); // idle, sent, verified
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // 타이머
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // 타이머 카운트다운 효과
  useEffect(() => {
    if (timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  // 타이머 포맷 (MM:SS)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // 인증번호 발송
  const handleSendCode = async () => {
    if (!email) {
      setVerifyError('이메일 주소를 입력해주세요.');
      return;
    }
    setSendingCode(true);
    setVerifyError('');
    try {
      await api.post('/auth/send-verification-code', { email });
      setVerificationStep('sent');
      setTimeLeft(300); // 5분
      setVerificationCode('');
      setVerifyError('');
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (detail === 'EMAIL_ALREADY_REGISTERED') {
        setVerifyError('이미 가입된 이메일입니다.');
      } else if (detail === 'EMAIL_SEND_FAILED') {
        setVerifyError('이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setVerifyError('인증번호 발송 중 오류가 발생했습니다.');
      }
    } finally {
      setSendingCode(false);
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerifyError('6자리 인증번호를 입력해주세요.');
      return;
    }
    setVerifyingCode(true);
    setVerifyError('');
    try {
      await api.post('/auth/verify-code', { email, code: verificationCode });
      setVerificationStep('verified');
      setTimeLeft(0);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (detail === 'CODE_EXPIRED') {
        setVerifyError('인증 시간이 초과되었습니다. 인증번호를 재전송해주세요.');
      } else if (detail === 'INVALID_CODE') {
        setVerifyError('잘못된 인증번호입니다. 다시 확인해주세요.');
      } else {
        setVerifyError('인증 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setVerifyingCode(false);
    }
  };

  // 회원가입 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (verificationStep !== 'verified') {
      alert('이메일 인증을 먼저 완료해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      alert('비밀번호는 6자리 이상이어야 합니다.');
      return;
    }
    
    try {
      await api.post('/auth/register', {
        email,
        password,
        nickname,
        location: '역삼동'
      });
      alert('회원가입이 완료되었습니다! 🎉\n지금 바로 로그인해보세요.');
      navigate('/login');
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (detail === 'EMAIL_NOT_VERIFIED') {
        alert('이메일 인증이 완료되지 않았습니다. 인증을 다시 진행해주세요.');
        setVerificationStep('idle');
      } else {
        alert(detail || '회원가입 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">부름(Buleum) 회원가입</h1>
        <p className="auth-subtitle">믿을 수 있는 이웃과 따뜻한 도움을 나눠보세요.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* 이메일 + 인증 영역 */}
          <div className="form-group">
            <label htmlFor="email">이메일 주소</label>
            <div className="email-verify-row">
              <input
                type="email"
                id="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // 이메일이 변경되면 인증 리셋
                  if (verificationStep !== 'idle') {
                    setVerificationStep('idle');
                    setTimeLeft(0);
                    setVerificationCode('');
                    setVerifyError('');
                  }
                }}
                disabled={verificationStep === 'verified'}
                required
              />
              <button
                type="button"
                className={`verify-send-btn ${verificationStep === 'verified' ? 'verified' : ''}`}
                onClick={handleSendCode}
                disabled={sendingCode || verificationStep === 'verified'}
              >
                {sendingCode ? '전송 중...' : verificationStep === 'verified' ? '인증완료 ✓' : verificationStep === 'sent' ? '재전송' : '인증번호 전송'}
              </button>
            </div>
          </div>

          {/* 인증코드 입력 영역 (발송 후 노출) */}
          {verificationStep === 'sent' && (
            <div className="verification-code-area">
              <div className="code-input-row">
                <input
                  type="text"
                  id="verificationCode"
                  className="code-input"
                  placeholder="인증번호 6자리"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setVerificationCode(val);
                  }}
                />
                <div className={`code-timer ${timeLeft <= 60 ? 'urgent' : ''}`}>
                  {timeLeft > 0 ? formatTime(timeLeft) : '만료됨'}
                </div>
              </div>
              <button
                type="button"
                className="verify-confirm-btn"
                onClick={handleVerifyCode}
                disabled={verifyingCode || timeLeft <= 0}
              >
                {verifyingCode ? '확인 중...' : '인증 확인'}
              </button>
              {timeLeft <= 0 && (
                <p className="code-expired-msg">
                  인증 시간이 초과되었습니다.
                  <button type="button" className="resend-link" onClick={handleSendCode}>
                    인증번호 재전송
                  </button>
                </p>
              )}
            </div>
          )}

          {/* 인증 완료 표시 */}
          {verificationStep === 'verified' && (
            <div className="verification-success-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              이메일 인증이 완료되었습니다
            </div>
          )}

          {/* 인증 에러 메시지 */}
          {verifyError && (
            <div className="verify-error-msg">{verifyError}</div>
          )}

          {/* 닉네임 */}
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

          {/* 비밀번호 */}
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

          {/* 비밀번호 확인 */}
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

          <button
            type="submit"
            className={`auth-submit-btn ${verificationStep !== 'verified' ? 'disabled' : ''}`}
            disabled={verificationStep !== 'verified'}
          >
            회원가입
          </button>
        </form>

        <div className="auth-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인하기</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
