import { apiRequest } from './api.js';

/**
 * Bookmark API Service Module
 */

export const getBookmarks = async () => {
  return apiRequest('/bookmarks', {
    method: 'GET'
  });
};

export const addBookmark = async (courseId) => {
  return apiRequest('/bookmarks', {
    method: 'POST',
    body: { courseId }
  });
};

export const removeBookmark = async (courseId) => {
  return apiRequest(`/bookmarks/${courseId}`, {
    method: 'DELETE'
  });
};
