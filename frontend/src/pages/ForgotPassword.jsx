import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 인증코드 입력, 3: 새 비밀번호
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 타이머 관련
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setTimeLeft(300); // 5분 = 300초
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const navigate = useNavigate();

  // Step 1: 이메일 입력 → 인증코드 발송
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccessMsg('입력하신 이메일로 인증번호를 발송했습니다.');
      setStep(2);
      startTimer();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'EMAIL_SEND_FAILED') {
        setError('이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 인증코드 검증
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-reset-code', { email, code });
      setSuccessMsg('인증이 완료되었습니다. 새 비밀번호를 설정해주세요.');
      setStep(3);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'CODE_EXPIRED') {
        setError('인증번호가 만료되었습니다. 다시 발송해주세요.');
      } else if (detail === 'INVALID_CODE') {
        setError('인증번호가 일치하지 않습니다.');
      } else if (detail === 'NO_VERIFICATION_RECORD') {
        setError('인증 요청 기록이 없습니다. 이메일을 다시 입력해주세요.');
      } else {
        setError('인증에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 인증코드 재발송
  const handleResendCode = async () => {
    setError('');
    setCode('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccessMsg('인증번호를 다시 발송했습니다.');
      startTimer();
    } catch (err) {
      setError('이메일 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: 새 비밀번호 설정
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        new_password: newPassword,
      });
      alert('비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.');
      navigate('/login');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'VERIFICATION_REQUIRED') {
        setError('인증이 완료되지 않았습니다. 처음부터 다시 시도해주세요.');
        setStep(1);
      } else if (detail === 'USER_NOT_FOUND') {
        setError('사용자를 찾을 수 없습니다.');
      } else {
        setError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">비밀번호 찾기</h1>
        <p className="auth-subtitle">
          {step === 1 && '가입하신 이메일 주소를 입력해주세요.'}
          {step === 2 && '이메일로 발송된 인증번호를 입력해주세요.'}
          {step === 3 && '새로운 비밀번호를 설정해주세요.'}
        </p>

        {/* 진행 단계 표시 */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '8px',
          marginBottom: '28px'
        }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              width: '32px', height: '4px', borderRadius: '2px',
              background: s <= step
                ? 'var(--primary-color)'
                : 'var(--border-color)',
              transition: 'background 0.3s ease'
            }} />
          ))}
        </div>

        {/* 성공 메시지 */}
        {successMsg && (
          <div className="verification-success-badge" style={{ marginBottom: '16px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="verify-error-msg" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Step 1: 이메일 입력 */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendCode}>
            <div className="form-group">
              <label htmlFor="reset-email">이메일 주소</label>
              <input
                type="email"
                id="reset-email"
                placeholder="가입 시 사용한 이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? '발송 중...' : '인증번호 받기'}
            </button>
          </form>
        )}

        {/* Step 2: 인증코드 입력 */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyCode}>
            <div className="verification-code-area">
              <div className="code-input-row">
                <input
                  type="text"
                  className="code-input"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
                <span className={`code-timer ${timeLeft <= 60 ? 'urgent' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                type="submit"
                className="verify-confirm-btn"
                disabled={code.length !== 6 || loading || timeLeft === 0}
              >
                {loading ? '확인 중...' : '인증번호 확인'}
              </button>
              {timeLeft === 0 && (
                <div className="code-expired-msg">
                  인증번호가 만료되었습니다.
                  <button type="button" className="resend-link" onClick={handleResendCode}>
                    다시 받기
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {/* Step 3: 새 비밀번호 설정 */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="new-password">새 비밀번호</label>
              <input
                type="password"
                id="new-password"
                placeholder="새 비밀번호를 입력하세요"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">비밀번호 확인</label>
              <input
                type="password"
                id="confirm-password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <div className="verify-error-msg">
                비밀번호가 일치하지 않습니다.
              </div>
            )}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login">로그인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
