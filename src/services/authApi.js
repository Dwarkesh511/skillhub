import { apiRequest } from './api.js';

/**
 * Authentication & User Profile API Service Module
 */

export const register = async (userData) => {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: userData
  });
};

export const login = async (credentials) => {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: credentials
  });
};

export const logout = async () => {
  return apiRequest('/auth/logout', {
    method: 'POST'
  });
};

export const getProfile = async () => {
  return apiRequest('/users/profile', {
    method: 'GET'
  });
};

export const updateProfile = async (profileData) => {
  return apiRequest('/users/profile', {
    method: 'PUT',
    body: profileData
  });
};

export const changePassword = async (passwordData) => {
  return apiRequest('/users/change-password', {
    method: 'PUT',
    body: passwordData
  });
};
