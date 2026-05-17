import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();

  const handlePayment = (e) => {
    e.preventDefault();
    alert('결제 예치금이 성공적으로 보관되었습니다. (안전결제 UI 데모)');
    navigate('/requests');
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <h1 className="page-title">안전결제</h1>
        <p className="page-subtitle">부름 지원자에게 지급할 금액을 안전하게 보관합니다.</p>

        <div className="payment-card">
          <div className="payment-summary">
            <h3>결제 요약</h3>
            <div className="summary-item">
              <span>서비스 내역</span>
              <strong>병원 동행 요청합니다</strong>
            </div>
            <div className="summary-item">
              <span>지원자 (부름이)</span>
              <strong>캠핑조아</strong>
            </div>
            <div className="summary-item total">
              <span>총 결제 금액</span>
              <strong className="price">30,000원</strong>
            </div>
          </div>

          <form className="payment-form" onSubmit={handlePayment}>
            <h3>결제 수단 선택</h3>
            <div className="payment-methods">
              <label className="method-radio">
                <input type="radio" name="payment_method" defaultChecked />
                <span>부름페이 (잔액: 50,000원)</span>
              </label>
              <label className="method-radio">
                <input type="radio" name="payment_method" />
                <span>신용/체크카드</span>
              </label>
              <label className="method-radio">
                <input type="radio" name="payment_method" />
                <span>계좌이체</span>
              </label>
            </div>

            <div className="payment-notice">
              <p>💡 결제된 금액은 부름이 완료되어 <strong>'확정'</strong>하기 전까지 안전하게 보관됩니다.</p>
            </div>

            <button type="submit" className="payment-submit-btn">30,000원 안전하게 예치하기</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Payment;
