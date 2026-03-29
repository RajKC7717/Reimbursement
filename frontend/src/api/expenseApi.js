import api from './index';

export const getExpenses = (params) => api.get('/expenses', { params });
export const getExpenseById = (id) => api.get(`/expenses/${id}`);
export const submitExpense = (data) => api.post('/expenses', data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const cancelExpense = (id) => api.delete(`/expenses/${id}`);
export const approveExpense = (id, data) => api.post(`/expenses/${id}/approve`, data);
export const rejectExpense = (id, data) => api.post(`/expenses/${id}/reject`, data);
export const overrideExpense = (id, data) => api.post(`/expenses/${id}/override`, data);
export const uploadReceipt = (formData) => api.post('/expenses/ocr', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
