import { apiRequest } from './api.js';

/**
 * Certificate API Service Module
 */

export const getCertificates = async () => {
  return apiRequest('/certificates', {
    method: 'GET'
  });
};

export const getCertificate = async (id) => {
  return apiRequest(`/certificates/${id}`, {
    method: 'GET'
  });
};

export const generateCertificate = async (courseId) => {
  return apiRequest(`/certificates/generate/${courseId}`, {
    method: 'POST'
  });
};
