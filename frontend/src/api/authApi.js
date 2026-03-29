import api from './index';

export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);
export const refreshToken = (data) => api.post('/auth/refresh', data);
export const logout = () => api.post('/auth/logout');
export const getProfile = () => api.get('/auth/me');
