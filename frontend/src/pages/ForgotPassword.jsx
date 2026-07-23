import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      console.error('Firebase password reset error:', err.code);
      if (err.code === 'auth/user-not-found') {
        // 보안상 동일한 메시지 표시
        setSent(true);
      } else if (err.code === 'auth/invalid-email') {
        setError('유효하지 않은 이메일 형식입니다.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('비밀번호 재설정 메일 발송 중 오류가 발생했습니다.');
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
          {sent
            ? '비밀번호 재설정 메일을 확인해주세요.'
            : '가입하신 이메일 주소를 입력해주세요.'}
        </p>

        {/* 에러 메시지 */}
        {error && (
          <div className="verify-error-msg" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {!sent ? (
          /* 이메일 입력 단계 */
          <form className="auth-form" onSubmit={handleSendResetEmail}>
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
              {loading ? '발송 중...' : '비밀번호 재설정 메일 받기'}
            </button>
          </form>
        ) : (
          /* 발송 완료 안내 */
          <div style={{
            background: 'linear-gradient(135deg, #FFF3E0, #FFF8E1)',
            border: '1px solid #FFE0B2',
            borderRadius: '12px',
            padding: '28px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📧</div>
            <p style={{ color: '#E65100', fontWeight: '700', fontSize: '16px', margin: '0 0 12px' }}>
              비밀번호 재설정 메일을 발송했습니다
            </p>
            <p style={{ color: '#795548', fontSize: '14px', margin: '0 0 16px', lineHeight: '1.6' }}>
              <strong>{email}</strong>으로 발송된 메일에서<br />
              비밀번호 재설정 링크를 클릭하여<br />
              새 비밀번호를 설정해주세요.
            </p>
            <div style={{
              background: '#FFF8E1',
              border: '1px dashed #FFB74D',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '12px'
            }}>
              <p style={{ color: '#F57C00', fontSize: '13px', margin: 0 }}>
                💡 메일이 보이지 않으면 스팸함도 확인해주세요.
              </p>
            </div>
          </div>
        )}

        <div className="auth-footer">
          <Link to="/login">로그인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
