import { apiRequest } from './api.js';

/**
 * Course Catalog & Category API Service Module
 */

export const getCourses = async (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });

  const queryString = query.toString();
  const endpoint = queryString ? `/courses?${queryString}` : '/courses';

  return apiRequest(endpoint, {
    method: 'GET'
  });
};

export const getCourseById = async (id) => {
  return apiRequest(`/courses/${id}`, {
    method: 'GET'
  });
};

export const getCategories = async () => {
  return apiRequest('/categories', {
    method: 'GET'
  });
};
