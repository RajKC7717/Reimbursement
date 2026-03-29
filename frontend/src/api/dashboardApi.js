import api from './index';

export const getDashboardStats = () => api.get('/dashboard/stats');
export const getPendingApprovals = () => api.get('/dashboard/pending');
export const getAuditLogs = (params) => api.get('/audit-logs', { params });
export const getCompany = () => api.get('/company');
export const updateCompany = (data) => api.put('/company', data);
export const getCountries = (params) => api.get('/countries', { params });
export const getExchangeRates = (base) => api.get('/currencies/rates', { params: { base } });
