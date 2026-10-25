/**
 * Central API Configuration
 * 
 * When our teammate's Java backend HTTP endpoints are available,
 * we can switch USE_MOCK to false and point API_BASE_URL to the server.
 */
export const USE_MOCK = true;
export const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Helper to simulate network latency for realistic async UI behavior
 */
export const simulateDelay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));
