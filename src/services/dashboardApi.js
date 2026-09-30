import { apiRequest } from './api.js';

/**
 * Student Dashboard API Service Module
 */

export const getDashboard = async () => {
  return apiRequest('/dashboard', {
    method: 'GET'
  });
};
