import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './PaymentPage.css';

const PaymentPage = () => {
  const { buleumId } = useParams();
  const navigate = useNavigate();
  const [buleum, setBuleum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    const fetchBuleum = async () => {
      try {
        const response = await api.get(`/items/${buleumId}`);
        setBuleum(response.data);
      } catch (error) {
        console.error('Error fetching buleum:', error);
        alert('정보를 불러오지 못했습니다.');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchBuleum();
  }, [buleumId]);

  const handlePayment = async () => {
    try {
      await api.post('/payments/deposit', {
        buleum_id: parseInt(buleumId),
        amount: buleum.price,
        payment_method: paymentMethod
      });
      alert('결제가 완료되었습니다. 대금이 안전하게 예치되었습니다.');
      navigate('/chat'); // 채팅방으로 돌아가기
    } catch (error) {
      console.error('Payment error:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (!buleum) return <div className="error">정보가 없습니다.</div>;

  return (
    <div className="payment-page">
      <div className="payment-container">
        <h1>안전결제</h1>
        
        <div className="payment-section buleum-info">
          <h3>주문 상품 정보</h3>
          <div className="item-card">
            <img src={buleum.image_url || '/placeholder.png'} alt={buleum.title} />
            <div className="item-details">
              <h4>{buleum.title}</h4>
              <p className="price">{buleum.price.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        <div className="payment-section method-selection">
          <h3>결제 수단 선택</h3>
          <div className="method-options">
            <label className={`method-option ${paymentMethod === 'card' ? 'active' : ''}`}>
              <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
              신용/체크카드
            </label>
            <label className={`method-option ${paymentMethod === 'transfer' ? 'active' : ''}`}>
              <input type="radio" value="transfer" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} />
              계좌이체
            </label>
            <label className={`method-option ${paymentMethod === 'kakao' ? 'active' : ''}`}>
              <input type="radio" value="kakao" checked={paymentMethod === 'kakao'} onChange={() => setPaymentMethod('kakao')} />
              카카오페이
            </label>
          </div>
        </div>

        <div className="payment-footer">
          <div className="total-price">
            <span>최종 결제 금액</span>
            <strong>{buleum.price.toLocaleString()}원</strong>
          </div>
          <button className="btn-pay" onClick={handlePayment}>결제하기</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
