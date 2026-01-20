import axios from 'axios';

export const client = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || '',
  timeout: 10000,
});

client.interceptors.response.use(
  res => res,
  err => {
    // 可统一处理错误、埋点、或把 error 转为业务型 Error
    return Promise.reject(err);
  }
);