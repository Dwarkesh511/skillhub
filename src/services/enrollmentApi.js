import { apiRequest } from './api.js';

/**
 * Course Enrollment API Service Module
 */

export const getEnrollments = async () => {
  return apiRequest('/enrollments', {
    method: 'GET'
  });
};

export const enrollInCourse = async (courseId) => {
  return apiRequest('/enrollments', {
    method: 'POST',
    body: { courseId }
  });
};

export const getEnrollment = async (courseId) => {
  return apiRequest(`/enrollments/${courseId}`, {
    method: 'GET'
  });
};
