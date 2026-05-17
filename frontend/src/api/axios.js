import axios from 'axios';
// Vite 프록시를 통해 요청 전달 (/api → http://127.0.0.1:8000/api)
const BASE_URL = '/api';
export const BACKEND_URL = '';

const api = axios.create({
  baseURL: BASE_URL,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
