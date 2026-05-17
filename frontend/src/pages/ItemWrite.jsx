import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { BACKEND_URL } from '../api/axios';
import './ItemWrite.css';

const ItemWrite = () => {
  const navigate = useNavigate();
  const locationState = useLocation();
  const editItem = locationState.state?.editItem;

  // Parse city and dong from existing location if editing
  const initialLocation = editItem?.location || '';
  const initialCity = initialLocation.includes(' ') ? initialLocation.split(' ')[0] : (initialLocation.endsWith('시') ? initialLocation : '서울시');
  const initialDong = initialLocation.includes(' ') ? initialLocation.split(' ').slice(1).join(' ') : (initialLocation.endsWith('시') ? '' : initialLocation);

  const [title, setTitle] = useState(editItem?.title || '');
  const [price, setPrice] = useState(editItem?.price || '');
  const [description, setDescription] = useState(editItem?.description || '');
  const [city, setCity] = useState(initialCity);
  const [dong, setDong] = useState(initialDong);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(
    editItem?.image_url 
      ? [editItem.image_url.startsWith('http') ? editItem.image_url : `${BACKEND_URL}${editItem.image_url}`] 
      : []
  );

  const cities = ['서울시', '부산시', '대구시', '인천시', '광주시', '대전시', '울산시', '세종시', '경기도', '강원도', '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주도'];

  const handleImageChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...files]);
      
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previews]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('price', price);
      formData.append('description', description);
      // Combine city and dong
      formData.append('location', `${city} ${dong}`.trim());
      
      if (imageFiles.length > 0) {
        formData.append('image', imageFiles[0]);
      }

      if (editItem) {
        await api.put(`/items/${editItem.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('부름 요청이 수정되었습니다!');
      } else {
        await api.post('/items', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert('부름 요청이 성공적으로 등록되었습니다!');
      }
      navigate('/items');
    } catch (error) {
      console.error('Error saving item:', error);
      alert(error.response?.data?.detail || '저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="write-page">
      <div className="write-container">
        <h1 className="write-title">부름 요청하기</h1>

        <form className="write-form" onSubmit={handleSubmit}>
          {/* Image Upload */}
          <div className="form-group image-upload-group">
            <label>사진 등록 (최대 10장)</label>
            <div className="image-uploader-wrapper">
              <label htmlFor="image-input" className="image-upload-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                <span>{imagePreviews.length}/10</span>
              </label>
              <input
                type="file"
                id="image-input"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              
              {imagePreviews.map((image, index) => (
                <div key={index} className="image-preview">
                   <img src={image} alt={`Preview ${index}`} />
                  <button
                    type="button"
                    className="delete-image-btn"
                    onClick={() => {
                      setImagePreviews(imagePreviews.filter((_, i) => i !== index));
                      setImageFiles(imageFiles.filter((_, i) => i !== index));
                    }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">제목</label>
            <input
              type="text"
              id="title"
              placeholder="글 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Price */}
          <div className="form-group">
            <label htmlFor="price">가격 (원)</label>
            <input
              type="number"
              id="price"
              placeholder="₩ 가격을 입력해주세요"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          {/* Location */}
          <div className="form-group location-group">
            <label htmlFor="city">부름이 필요한 장소</label>
            <div className="location-inputs" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select 
                id="city" 
                value={city} 
                onChange={(e) => setCity(e.target.value)}
                className="city-select"
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '120px', flex: '1' }}
              >
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="text"
                id="dong"
                placeholder="동/상세지역 입력 (예: 역삼동)"
                value={dong}
                onChange={(e) => setDong(e.target.value)}
                required
                style={{ flex: '2', minWidth: '150px', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">자세한 설명</label>
            <textarea
              id="description"
              rows="8"
              placeholder="심부름 내용을 자세히 작성해주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          <button type="submit" className="write-submit-btn">작성 완료</button>
        </form>
      </div>
    </div>
  );
};

export default ItemWrite;
