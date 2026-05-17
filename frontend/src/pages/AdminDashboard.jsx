import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } else if (activeTab === 'items') {
        const res = await api.get('/admin/items');
        setItems(res.data);
      }
    } catch (err) {
      console.error('Admin data fetch error:', err);
      if (err.response?.status === 403) {
        alert('관리자 권한이 없습니다.');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('정말 이 회원을 탈퇴 처리하시겠습니까?')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        setUsers(users.filter(u => u.id !== userId));
        alert('처리되었습니다.');
      } catch (err) {
        alert('삭제 실패: ' + (err.response?.data?.detail || '오류 발생'));
      }
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      try {
        await api.delete(`/admin/items/${itemId}`);
        setItems(items.filter(i => i.id !== itemId));
        alert('삭제되었습니다.');
      } catch (err) {
        alert('삭제 실패');
      }
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <h2 className="admin-logo">어드민 시스템</h2>
        <nav className="admin-nav">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>통계 대시보드</button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>회원 관리</button>
          <button className={activeTab === 'items' ? 'active' : ''} onClick={() => setActiveTab('items')}>게시물 관리</button>
        </nav>
      </div>

      <main className="admin-main">
        <header className="admin-header">
          <h1>{activeTab === 'dashboard' ? '통계 요약' : activeTab === 'users' ? '회원 목록' : '게시물 목록'}</h1>
          <div className="admin-user-info">관리자님 환영합니다</div>
        </header>

        <div className="admin-content">
          {loading ? (
            <div className="loading">데이터 불러오는 중...</div>
          ) : activeTab === 'dashboard' && stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <h3>전체 회원</h3>
                <p className="stat-number">{stats.total_users}</p>
              </div>
              <div className="stat-card">
                <h3>전체 게시글</h3>
                <p className="stat-number">{stats.total_items}</p>
              </div>
              <div className="stat-card">
                <h3>완료된 거래</h3>
                <p className="stat-number">{stats.completed_items}</p>
              </div>
              <div className="stat-card">
                <h3>등록된 전문가</h3>
                <p className="stat-number">{stats.active_experts}</p>
              </div>
              <div className="stat-card">
                <h3>결제 건수</h3>
                <p className="stat-number">{stats.total_payments}</p>
              </div>
            </div>
          ) : activeTab === 'users' ? (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>닉네임</th>
                    <th>이메일</th>
                    <th>가입일</th>
                    <th>권한</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.nickname}</td>
                      <td>{u.email}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>{u.is_admin ? '관리자' : '일반'}</td>
                      <td>
                        {!u.is_admin && <button className="btn-delete-sm" onClick={() => handleDeleteUser(u.id)}>탈퇴</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>제목</th>
                    <th>작성자</th>
                    <th>가격</th>
                    <th>상태</th>
                    <th>작성일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.id}>
                      <td>{i.id}</td>
                      <td className="table-title">{i.title}</td>
                      <td>{i.user_nickname}</td>
                      <td>{i.price.toLocaleString()}원</td>
                      <td><span className={`status-badge ${i.status}`}>{i.status}</span></td>
                      <td>{new Date(i.created_at).toLocaleDateString()}</td>
                      <td>
                        <button className="btn-delete-sm" onClick={() => handleDeleteItem(i.id)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
