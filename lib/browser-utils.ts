/**
 * Safe browser environment utilities
 */

/**
 * Check if code is running in a browser environment
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Safely access window properties
 * @param accessor Function that accesses window properties
 * @param fallback Value to return if window is undefined
 */
export const safeWindow = <T>(accessor: () => T, fallback: T): T => {
  if (isBrowser()) {
    try {
      return accessor();
    } catch (error) {
      console.error('Error accessing window property:', error);
      return fallback;
    }
  }
  return fallback;
};

/**
 * Safely get window location
 */
export const getWindowLocation = (): Location | null => {
  return safeWindow(() => window.location, null);
};

/**
 * Safely navigate to a URL
 * @param url URL to navigate to
 */
export const safeNavigate = (url: string): void => {
  if (isBrowser()) {
    window.location.href = url;
  }
}; 