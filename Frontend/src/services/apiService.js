import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:4000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log("Attaching token:", token);
  if (token) {
    config.headers['auth-token'] = token;
  }
  return config;
});
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';  
    }
    return Promise.reject(err);
  }
);

export default API;