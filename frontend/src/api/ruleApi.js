import api from './index';

export const getRules = () => api.get('/rules');
export const getRuleById = (id) => api.get(`/rules/${id}`);
export const createRule = (data) => api.post('/rules', data);
export const updateRule = (id, data) => api.put(`/rules/${id}`, data);
export const deleteRule = (id) => api.delete(`/rules/${id}`);
