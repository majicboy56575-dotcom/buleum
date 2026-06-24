import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './CustomerCenter.css';

const faqData = [
  {
    question: '부름 서비스는 어떤 서비스인가요?',
    answer: '부름은 효도 대행 및 심부름 매칭 서비스입니다. 바쁜 일상 속에서 부모님을 직접 찾아뵙기 어려운 분들을 위해, 검증된 전문가가 대신 부모님을 돌봐드리는 따뜻한 서비스입니다. 병원 동행, 장보기, 말벗 서비스 등 다양한 효도 대행 서비스를 제공합니다.',
  },
  {
    question: '결제는 어떻게 이루어지나요?',
    answer: '부름은 안전결제 시스템을 운영합니다. 서비스 요청 시 결제 금액이 부름에 예치되며, 서비스가 완료되고 구매 확정을 하시면 전문가에게 대금이 지급됩니다. 서비스에 문제가 있을 경우 환불도 가능합니다.',
  },
  {
    question: '전문가 인증은 어떻게 하나요?',
    answer: '전문가로 활동하시려면 신원 인증 서류를 제출하셔야 합니다. 프로필 페이지에서 "신원 인증" 메뉴를 통해 신분증, 자격증 등의 서류를 업로드하시면 관리자 검토 후 인증이 완료됩니다. 인증된 전문가에게는 인증 배지가 부여됩니다.',
  },
  {
    question: '서비스 이용 중 문제가 발생하면 어떻게 하나요?',
    answer: '서비스 이용 중 문제가 발생하면 고객센터(1544-1234)로 연락하시거나, 1:1 문의를 통해 상담을 요청하실 수 있습니다. 평일 09:00~18:00 운영하며, 긴급한 경우 채팅을 통해 실시간 상담도 가능합니다.',
  },
  {
    question: '후기는 어떻게 작성하나요?',
    answer: '서비스 완료 후 구매 확정을 하시면 후기 작성이 가능합니다. 작성하신 후기는 전문가의 매너온도에 반영되어 다른 이용자분들의 전문가 선택에 도움이 됩니다. 솔직하고 상세한 후기를 남겨주시면 감사하겠습니다.',
  },
  {
    question: '서비스 지역은 어디까지인가요?',
    answer: '현재 부름 서비스는 서울특별시 및 수도권 지역을 중심으로 운영되고 있습니다. 향후 전국으로 서비스 지역을 확대할 예정이며, 새로운 지역 오픈 시 공지사항을 통해 안내드리겠습니다.',
  },
];

const CustomerCenter = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaq = searchQuery.trim()
    ? faqData.filter(
        (item) =>
          item.question.includes(searchQuery) ||
          item.answer.includes(searchQuery)
      )
    : faqData;

  return (
    <div className="customer-center-page">
      {/* Hero Section */}
      <section className="cc-hero">
        <h1 className="cc-hero-title">고객센터</h1>
        <p className="cc-hero-subtitle">무엇을 도와드릴까요?</p>
        <div className="cc-search-wrapper">
          <input
            id="cc-search"
            type="text"
            className="cc-search-input"
            placeholder="궁금한 점을 검색해보세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="cc-search-icon">🔍</span>
        </div>
      </section>

      {/* Category Cards */}
      <section className="cc-categories">
        <div className="cc-categories-grid">
          <div
            className="cc-category-card cc-fade-in cc-fade-in-delay-1"
            onClick={() => {
              setSearchQuery('');
              document.querySelector('.cc-faq-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="cc-category-icon cc-icon-blue">📋</div>
            <div className="cc-category-title">자주 묻는 질문</div>
            <div className="cc-category-desc">빠르게 궁금증을 해결하세요</div>
          </div>
          <a href="tel:15441234" className="cc-category-card cc-fade-in cc-fade-in-delay-2">
            <div className="cc-category-icon cc-icon-green">📞</div>
            <div className="cc-category-title">전화 상담</div>
            <div className="cc-category-desc">1544-1234로 연결됩니다</div>
          </a>
          <Link to="/chat" className="cc-category-card cc-fade-in cc-fade-in-delay-3">
            <div className="cc-category-icon cc-icon-purple">💬</div>
            <div className="cc-category-title">1:1 문의</div>
            <div className="cc-category-desc">채팅으로 실시간 상담하세요</div>
          </Link>
          <div
            className="cc-category-card cc-fade-in cc-fade-in-delay-4"
            onClick={() => {
              document.querySelector('.cc-contact-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="cc-category-icon cc-icon-orange">📢</div>
            <div className="cc-category-title">공지사항</div>
            <div className="cc-category-desc">최신 소식을 확인하세요</div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="cc-faq-section">
        <h2 className="cc-section-title">
          <span className="cc-section-title-icon">💡</span>
          자주 묻는 질문
        </h2>
        <div className="cc-faq-list">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((item, index) => (
              <div
                key={index}
                className={`cc-faq-item ${openIndex === index ? 'active' : ''}`}
              >
                <button
                  className="cc-faq-question"
                  onClick={() => toggleFaq(index)}
                  id={`faq-question-${index}`}
                >
                  <span>{item.question}</span>
                  <span className="cc-faq-chevron">▶</span>
                </button>
                <div className="cc-faq-answer">
                  <div className="cc-faq-answer-inner">{item.answer}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="cc-contact-section">
        <div className="cc-contact-inner">
          <h2 className="cc-contact-title">다른 방법으로 문의하기</h2>
          <div className="cc-contact-grid">
            <div className="cc-contact-card">
              <div className="cc-contact-icon">📞</div>
              <div className="cc-contact-label">전화 상담</div>
              <div className="cc-contact-value">1544-1234</div>
              <div className="cc-contact-sub">평일 09:00 ~ 18:00</div>
            </div>
            <div className="cc-contact-card">
              <div className="cc-contact-icon">✉️</div>
              <div className="cc-contact-label">이메일 문의</div>
              <div className="cc-contact-value">support@buleum.com</div>
              <div className="cc-contact-sub">24시간 접수 가능</div>
            </div>
            <div className="cc-contact-card">
              <div className="cc-contact-icon">🏢</div>
              <div className="cc-contact-label">오시는 길</div>
              <div className="cc-contact-value" style={{ fontSize: '15px' }}>서울특별시 강남구 역삼동</div>
              <div className="cc-contact-sub">부름타워 10층</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerCenter;
