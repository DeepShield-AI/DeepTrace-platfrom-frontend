// axios client（baseURL、timeout、拦截器）
import axios from 'axios';

export const client = axios.create({
  baseURL: 'http://localhost:8081',
  timeout: 10000,
});

client.interceptors.request.use(
  config => {
    // token存在localStorage
    const token = localStorage.getItem('auth_token');
    console.log('Request Interceptor - Token:', token);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);