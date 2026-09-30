import { apiRequest } from './api.js';

/**
 * Lesson Progress & Learning API Service Module
 */

export const toggleLessonProgress = async (lessonId, completed) => {
  return apiRequest('/progress/toggle', {
    method: 'POST',
    body: { lessonId, completed }
  });
};

export const getCourseProgress = async (courseId) => {
  return apiRequest(`/progress/course/${courseId}`, {
    method: 'GET'
  });
};

export const getUserProgress = async () => {
  return apiRequest('/progress', {
    method: 'GET'
  });
};
