/**
 * Central API Configuration
 * 
 * Connected to Member 3's Java Backend & JDBC Server (Port 8080).
 * When USE_MOCK is false, services fetch live data from the Java REST API.
 * If the Java server is offline, services gracefully fallback to mock data.
 */
export const USE_MOCK = false;
export const API_BASE_URL = 'https://gamevault-vkx1.onrender.com/api';

/**
 * Helper to simulate network latency for realistic async UI behavior
 */
export const simulateDelay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));
