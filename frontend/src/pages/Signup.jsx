import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth } from '../firebase';
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
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Firebase 사용자 참조
  const firebaseUserRef = useRef(null);

  // 타이머 (재발송 쿨다운)
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (resendCooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [resendCooldown]);

  // 컴포넌트 언마운트 시 인증 안 된 Firebase 사용자 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 인증 메일 발송
  const handleSendVerification = async () => {
    if (!email) {
      setVerifyError('이메일 주소를 입력해주세요.');
      return;
    }
    if (!password) {
      setVerifyError('비밀번호를 먼저 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      setVerifyError('비밀번호는 6자리 이상이어야 합니다.');
      return;
    }

    setSendingCode(true);
    setVerifyError('');

    try {
      // Firebase에 계정 생성 + 인증 메일 발송
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUserRef.current = userCredential.user;
      await sendEmailVerification(userCredential.user);
      
      setVerificationStep('sent');
      setResendCooldown(60); // 60초 재발송 쿨다운
    } catch (error) {
      console.error('Firebase error:', error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        try {
          // 이전에 가입을 완료하지 못한 계정인지 확인하기 위해 로그인 시도
          const signInResult = await signInWithEmailAndPassword(auth, email, password);
          const user = signInResult.user;

          if (!user.emailVerified) {
            // 이메일 인증이 되지 않은 미완료 계정이면 인증 메일 재발송
            await sendEmailVerification(user);
            firebaseUserRef.current = user;
            setVerificationStep('sent');
            setResendCooldown(60);
            setVerifyError('이전에 인증되지 않은 가입 시도가 있어 인증 메일을 재발송했습니다.');
          } else {
            setVerifyError('이미 이메일 인증 및 회원가입이 완료된 계정입니다. 로그인해주세요.');
          }
        } catch (signInError) {
          setVerifyError('이미 사용 중인 이메일입니다. (비밀번호 불일치 또는 기존 계정)');
        }
      } else if (error.code === 'auth/invalid-email') {
        setVerifyError('유효하지 않은 이메일 형식입니다.');
      } else if (error.code === 'auth/weak-password') {
        setVerifyError('비밀번호가 너무 약합니다. 6자리 이상 입력해주세요.');
      } else {
        setVerifyError('인증 메일 발송 중 오류가 발생했습니다.');
      }
    } finally {
      setSendingCode(false);
    }
  };

  // 인증 메일 재발송
  const handleResendVerification = async () => {
    if (!firebaseUserRef.current) return;
    setSendingCode(true);
    setVerifyError('');
    try {
      await sendEmailVerification(firebaseUserRef.current);
      setResendCooldown(60);
      setVerifyError('');
    } catch (error) {
      if (error.code === 'auth/too-many-requests') {
        setVerifyError('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setVerifyError('인증 메일 재발송 중 오류가 발생했습니다.');
      }
    } finally {
      setSendingCode(false);
    }
  };

  // 인증 확인 (Firebase에서 이메일 인증 여부 체크)
  const handleCheckVerification = async () => {
    if (!firebaseUserRef.current) {
      setVerifyError('인증 메일을 먼저 발송해주세요.');
      return;
    }
    setVerifyingCode(true);
    setVerifyError('');
    try {
      await firebaseUserRef.current.reload();
      if (firebaseUserRef.current.emailVerified) {
        setVerificationStep('verified');
      } else {
        setVerifyError('아직 이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.');
      }
    } catch (error) {
      setVerifyError('인증 확인 중 오류가 발생했습니다.');
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
      // Firebase ID Token 최신화하여 가져오기 (forceRefresh = true)
      // 이메일 인증 후 캐시된 이전 토큰(email_verified: false)이 전달되는 현상 방지
      const idToken = await firebaseUserRef.current.getIdToken(true);

      await api.post('/auth/register', {
        email,
        password,
        nickname,
        location: '역삼동',
        firebase_token: idToken
      });
      alert('회원가입이 완료되었습니다! 🎉\n지금 바로 로그인해보세요.');
      navigate('/login');
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (detail === 'EMAIL_NOT_VERIFIED') {
        alert('이메일 인증이 완료되지 않았습니다. 인증을 다시 진행해주세요.');
        setVerificationStep('idle');
      } else if (detail === 'INVALID_FIREBASE_TOKEN') {
        alert('인증 정보 검증 중 일시적 오류가 발생했습니다. 회원가입 버튼을 다시 한번 눌러주세요.');
      } else if (detail === 'Email already registered') {
        alert('이미 가입된 이메일입니다.');
      } else if (detail === 'Nickname already taken') {
        alert('이미 사용 중인 닉네임입니다.');
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
          {/* 이메일 */}
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
                  if (verificationStep !== 'idle') {
                    setVerificationStep('idle');
                    setVerifyError('');
                    firebaseUserRef.current = null;
                  }
                }}
                disabled={verificationStep === 'sent' || verificationStep === 'verified'}
                required
              />
              <button
                type="button"
                className={`verify-send-btn ${verificationStep === 'verified' ? 'verified' : ''}`}
                onClick={handleSendVerification}
                disabled={sendingCode || verificationStep === 'sent' || verificationStep === 'verified'}
              >
                {sendingCode ? '전송 중...' : verificationStep === 'verified' ? '인증완료 ✓' : '인증 메일 발송'}
              </button>
            </div>
          </div>

          {/* 비밀번호 (인증 메일 발송 전에 입력) */}
          {verificationStep === 'idle' && (
            <>
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
            </>
          )}

          {/* 인증 메일 발송 후 안내 */}
          {verificationStep === 'sent' && (
            <div className="verification-code-area">
              <div style={{
                background: 'linear-gradient(135deg, #FFF3E0, #FFF8E1)',
                border: '1px solid #FFE0B2',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📧</div>
                <p style={{ color: '#E65100', fontWeight: '600', margin: '0 0 8px' }}>
                  인증 메일을 발송했습니다
                </p>
                <p style={{ color: '#795548', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                  <strong>{email}</strong>으로 발송된 메일에서<br />
                  인증 링크를 클릭한 후 아래 버튼을 눌러주세요.
                </p>
              </div>

              <button
                type="button"
                className="verify-confirm-btn"
                onClick={handleCheckVerification}
                disabled={verifyingCode}
                style={{ width: '100%', marginBottom: '8px' }}
              >
                {verifyingCode ? '확인 중...' : '인증 완료 확인'}
              </button>

              <button
                type="button"
                className="resend-link"
                onClick={handleResendVerification}
                disabled={sendingCode || resendCooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? '#999' : 'var(--primary-color)',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  fontSize: '13px',
                  padding: '8px',
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                {resendCooldown > 0
                  ? `인증 메일 재발송 (${resendCooldown}초)`
                  : '인증 메일 재발송'}
              </button>
            </div>
          )}

          {/* 인증 완료 표시 */}
          {verificationStep === 'verified' && (
            <>
              <div className="verification-success-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                이메일 인증이 완료되었습니다
              </div>

              {/* 닉네임 (인증 완료 후 표시) */}
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

              {/* 비밀번호 확인 표시 (이미 입력한 비밀번호) */}
              <div className="form-group">
                <label>비밀번호</label>
                <input
                  type="password"
                  value={password}
                  disabled
                  style={{ background: '#f5f5f5' }}
                />
              </div>
            </>
          )}

          {/* 인증 에러 메시지 */}
          {verifyError && (
            <div className="verify-error-msg">{verifyError}</div>
          )}

          {/* 닉네임 - idle 상태에서도 보여줌 */}
          {verificationStep === 'idle' && (
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
          )}

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
