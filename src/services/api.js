const API_BASE_URL = 
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL)) ||
  (typeof process !== 'undefined' && (process.env?.VITE_API_URL || process.env?.VITE_API_BASE_URL)) ||
  'http://localhost:5000/api';

/**
 * Reusable HTTP client request helper for SkillHub backend APIs.
 * Automatically handles API_BASE_URL prefixing, HttpOnly cookie credentials,
 * JSON serialization, and consistent error handling.
 *
 * @param {string} endpoint - Relative API path (e.g., '/auth/login', 'courses')
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<any>} Parsed JSON response body
 */
export const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', body, headers = {}, ...customConfig } = options;

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    credentials: 'include', // Crucial for sending/receiving HttpOnly cookies (skillhub_token)
    ...customConfig
  };

  if (body) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    const error = new Error('Network error. Failed to communicate with SkillHub backend server.');
    error.status = 0;
    throw error;
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
