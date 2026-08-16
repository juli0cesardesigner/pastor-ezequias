const STORAGE_KEY = 'ezequias_profile_supporters_count';
export const BASE_SUPPORTERS_COUNT = 82;

/**
 * Retrieves the current supporters count from local cache or baseline
 */
export function getStoredSupportersCount(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= BASE_SUPPORTERS_COUNT) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage issues
  }
  return BASE_SUPPORTERS_COUNT;
}

/**
 * Increments supporters count when photo is downloaded
 */
export function incrementLocalSupportersCount(): number {
  try {
    const current = getStoredSupportersCount();
    const next = current + 1;
    localStorage.setItem(STORAGE_KEY, next.toString());
    return next;
  } catch {
    return BASE_SUPPORTERS_COUNT + 1;
  }
}
