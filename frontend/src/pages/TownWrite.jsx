import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './ItemWrite.css';

const TownWrite = () => {
  const [category, setCategory] = useState('동네질문');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const navigate = useNavigate();

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
      formData.append('category', category);
      formData.append('content', content);
      formData.append('location', '역삼동'); // default location
      
      if (imageFiles.length > 0) {
        formData.append('image', imageFiles[0]);
      }

      await api.post('/town/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('동네생활 글이 성공적으로 등록되었습니다!');
      navigate('/town');
    } catch (error) {
      console.error('Error creating town post:', error);
      alert(error.response?.data?.detail || '등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="write-page">
      <div className="write-container">
        <h1 className="write-title">동네생활 글쓰기</h1>

        <form className="write-form" onSubmit={handleSubmit}>
          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">카테고리</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '16px',
                color: '#212529',
                backgroundColor: '#fff',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              <option value="동네질문">동네질문</option>
              <option value="동네맛집">동네맛집</option>
              <option value="일상">일상</option>
              <option value="동네소식">동네소식</option>
            </select>
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="content">내용</label>
            <textarea
              id="content"
              rows="10"
              placeholder="우리 동네 관련된 질문이나 이야기를 해보세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            ></textarea>
          </div>

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

          <button type="submit" className="write-submit-btn">작성 완료</button>
        </form>
      </div>
    </div>
  );
};

export default TownWrite;
