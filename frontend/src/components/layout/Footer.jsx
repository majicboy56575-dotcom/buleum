import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-links">
          <a href="#!">이용약관</a>
          <a href="#!">개인정보처리방침</a>
          <a href="#!">위치기반서비스 이용약관</a>
          <a href="#!">이용자보호 비전과 계획</a>
        </div>
        <div className="footer-info">
          <p>고객센터: 1544-1234 (평일 09:00 ~ 18:00)</p>
          <p>주소: 서울특별시 강남구 역삼동 부름타워</p>
          <p>&copy; {new Date().getFullYear()} Buleum. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
