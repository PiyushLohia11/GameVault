import { API_BASE_URL, USE_MOCK } from './apiConfig';

/**
 * Presence heartbeat service.
 * Sends periodic user heartbeat/presence updates or gracefully no-ops.
 * 
 * @param {number} userId
 * @returns {() => void} Cleanup function to stop heartbeat on unmount
 */
export function startPresenceHeartbeat(userId = 1) {
  const intervalId = setInterval(async () => {
    if (!USE_MOCK && API_BASE_URL) {
      try {
        await fetch(`${API_BASE_URL}/users/${userId}/presence`, {
          method: 'POST',
        }).catch(() => {
          // Gracefully ignore network/backend errors
        });
      } catch {
        // Silently ignore when backend route is not available
      }
    }
  }, 60000);

  return () => clearInterval(intervalId);
}

export default {
  startPresenceHeartbeat,
};
