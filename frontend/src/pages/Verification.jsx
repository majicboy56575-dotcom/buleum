import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Verification.css';

const Verification = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0].name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('파일을 첨부해주세요.');
      return;
    }
    alert('신원/자격증 인증 자료가 성공적으로 제출되었습니다. 심사 후 프로필에 배지가 부여됩니다! (UI 데모)');
    navigate('/profile');
  };

  return (
    <div className="verification-page">
      <div className="verification-container">
        <h1 className="page-title">신원 / 자격증 인증</h1>
        <p className="page-subtitle">전문가 프로필에 인증 배지를 달고 신뢰도를 높여보세요.</p>

        <div className="verification-card">
          <div className="verification-guide">
            <h3>인증을 하면 어떤 점이 좋나요?</h3>
            <ul>
              <li><span className="emoji">🏅</span> 프로필에 공식 인증 배지가 부여됩니다.</li>
              <li><span className="emoji">🤝</span> 고객에게 더 큰 신뢰를 주어 부름 수락 확률이 높아집니다.</li>
              <li><span className="emoji">🔒</span> 인증 정보는 철저하게 암호화되어 안전하게 보관됩니다.</li>
            </ul>
          </div>

          <form className="verification-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>인증 종류 선택</label>
              <select className="verify-select">
                <option value="id">신분증 (본인 인증)</option>
                <option value="care">요양보호사 자격증</option>
                <option value="nurse">간호사 면허증</option>
                <option value="clean">정리수납전문가 자격증</option>
                <option value="etc">기타 전문 자격증</option>
              </select>
            </div>

            <div className="form-group">
              <label>증명서 사진 첨부</label>
              <div className="file-upload-box">
                <input 
                  type="file" 
                  id="cert-upload" 
                  accept="image/*,.pdf" 
                  onChange={handleFileChange} 
                  className="file-input"
                />
                <label htmlFor="cert-upload" className="file-upload-label">
                  <div className="upload-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  </div>
                  <span className="upload-text">
                    {selectedFile ? selectedFile : '클릭하여 파일 선택 (JPG, PNG, PDF)'}
                  </span>
                </label>
              </div>
              <p className="help-text">주민등록번호 뒷자리는 가리고 업로드해주세요.</p>
            </div>

            <button type="submit" className="submit-verify-btn">인증 서류 제출하기</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Verification;
