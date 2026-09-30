import { apiRequest } from './api.js';

export const getHealth = async () => {
  return apiRequest('/health');
};
