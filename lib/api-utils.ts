/**
 * Helper functions for handling API calls that redirect to Netlify Functions
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get the correct API base URL depending on environment
 */
export function getApiBaseUrl(): string {
  return isProduction 
    ? '/.netlify/functions'
    : '/api';
}

/**
 * Format API URL to use either Netlify Functions or Next.js API routes
 */
export function formatApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  
  // Remove leading slash if present on endpoint
  const cleanEndpoint = endpoint.startsWith('/') 
    ? endpoint.substring(1) 
    : endpoint;
    
  return `${baseUrl}/${cleanEndpoint}`;
}

/**
 * Standard fetch wrapper for API calls
 */
export async function fetchApi<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<T> {
  const url = formatApiUrl(endpoint);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }
  
  return response.json() as Promise<T>;
} 