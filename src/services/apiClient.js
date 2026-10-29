import { API_BASE_URL } from './apiConfig';

/**
 * Builds request options for JSON payloads.
 *
 * @param {string} method
 * @param {any} body
 * @returns {RequestInit}
 */
export function apiJson(method, body) {
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
}

/**
 * Common fetch helper for backend REST API calls.
 *
 * @param {string} endpoint
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`API error ${response.status} ${response.statusText}: ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }

  return null;
}

export default {
  apiRequest,
  apiJson,
};
