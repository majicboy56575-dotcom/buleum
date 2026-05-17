import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Review.css';

const Review = () => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const navigate = useNavigate();

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('별점을 선택해주세요!');
      return;
    }
    alert('따뜻한 후기가 전달되었습니다. 상대방의 매너온도가 올라갔습니다! (UI 데모)');
    navigate('/requests');
  };

  return (
    <div className="review-page">
      <div className="review-container">
        <h1 className="page-title">따뜻한 후기 남기기</h1>
        <p className="page-subtitle">부름 거래는 어떠셨나요? 상대방에 대한 후기를 남겨주세요.</p>

        <div className="review-card">
          <div className="target-profile">
            <div className="target-avatar">
              <span>캠</span>
            </div>
            <div className="target-info">
              <h3>캠핑조아</h3>
              <p>병원 동행 요청합니다</p>
            </div>
          </div>

          <form className="review-form" onSubmit={handleReviewSubmit}>
            <div className="rating-section">
              <h3>만족도를 별점으로 평가해주세요</h3>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${rating >= star ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="review-text-section">
              <h3>어떤 점이 좋았나요? (선택)</h3>
              <textarea
                placeholder="상대방을 칭찬하는 따뜻한 한마디를 남겨주세요. 남겨주신 후기는 상대방의 프로필에 공개됩니다."
                rows="5"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              ></textarea>
            </div>

            <button type="submit" className="submit-review-btn">후기 보내기</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Review;
