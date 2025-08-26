/**
 * Enhanced API Client with robust error handling, retry logic, and offline support
 */

interface APIOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  cache?: RequestCache;
  headers?: Record<string, string>;
}

interface APIResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  success: boolean;
}

class APIClient {
  private baseURL: string;
  private defaultOptions: APIOptions;

  constructor(baseURL = '', options: APIOptions = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = {
      retries: 3,
      retryDelay: 1000,
      timeout: 10000,
      cache: 'no-cache',
      ...options,
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRetryableError(status: number, error: Error): boolean {
    // Retry on network errors, 5xx errors, and specific 4xx errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
    if (error.name === 'AbortError') return false;
    if (status >= 500) return true;
    if (status === 408 || status === 429) return true;
    return false;
  }

  private async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    apiOptions: APIOptions = {}
  ): Promise<APIResponse<T>> {
    const config = { ...this.defaultOptions, ...apiOptions };
    const url = `${this.baseURL}${endpoint}`;

    let lastError: Error = new Error('Unknown error');
    let lastStatus = 0;

    for (let attempt = 0; attempt <= (config.retries || 0); attempt++) {
      try {
        const requestOptions: RequestInit = {
          ...options,
          cache: config.cache,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
            ...options.headers,
          },
        };

        const response = await this.fetchWithTimeout(url, requestOptions, config.timeout || 10000);
        lastStatus = response.status;

        // Handle successful responses
        if (response.ok) {
          try {
            const data = await response.json();
            return {
              data,
              error: null,
              status: response.status,
              success: true,
            };
          } catch (parseError) {
            // If JSON parsing fails but response was ok, return success with null data
            return {
              data: null,
              error: null,
              status: response.status,
              success: true,
            };
          }
        }

        // Handle error responses
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Use default error message if JSON parsing fails
        }

        const error = new Error(errorMessage);
        lastError = error;

        // Check if we should retry
        if (attempt < (config.retries || 0) && this.isRetryableError(response.status, error)) {
          await this.delay((config.retryDelay || 1000) * Math.pow(2, attempt));
          continue;
        }

        // Return error response
        return {
          data: null,
          error: errorMessage,
          status: response.status,
          success: false,
        };

      } catch (error) {
        lastError = error as Error;
        lastStatus = 0;

        // Check if we should retry on network errors
        if (attempt < (config.retries || 0) && this.isRetryableError(0, lastError)) {
          await this.delay((config.retryDelay || 1000) * Math.pow(2, attempt));
          continue;
        }

        // Return network error
        return {
          data: null,
          error: lastError.message || 'Network error occurred',
          status: 0,
          success: false,
        };
      }
    }

    // Final fallback
    return {
      data: null,
      error: lastError.message || 'Request failed after retries',
      status: lastStatus,
      success: false,
    };
  }

  // GET request
  async get<T = any>(endpoint: string, options: APIOptions = {}): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' }, options);
  }

  // POST request
  async post<T = any>(
    endpoint: string, 
    data?: any, 
    options: APIOptions = {}
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      options
    );
  }

  // PUT request
  async put<T = any>(
    endpoint: string, 
    data?: any, 
    options: APIOptions = {}
  ): Promise<APIResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      options
    );
  }

  // DELETE request
  async delete<T = any>(endpoint: string, options: APIOptions = {}): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' }, options);
  }
}

// Singleton instance
export const apiClient = new APIClient('/api');

// Utility functions for common operations
export const eventsAPI = {
  getAll: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams({
      showPast: 'true',
      status: 'ALL',
      t: Date.now().toString(), // Cache busting
      ...params,
    });
    return apiClient.get(`/events?${query}`);
  },

  getById: (id: string) => {
    return apiClient.get(`/events/${id}?t=${Date.now()}`);
  },

  register: (eventId: string, data: any) => {
    return apiClient.post(`/events/${eventId}/register`, data);
  },
};

export const authAPI = {
  login: (email: string, password: string) => {
    return apiClient.post('/auth/login', { email, password });
  },

  register: (data: any) => {
    return apiClient.post('/auth/register', data);
  },

  resetPassword: (email: string) => {
    return apiClient.post('/auth/reset-password', { email });
  },
};

// Offline support utilities
export const cacheManager = {
  set: (key: string, data: any, ttl = 5 * 60 * 1000) => {
    try {
      const item = {
        data,
        expires: Date.now() + ttl,
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  },

  get: (key: string) => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const item = JSON.parse(cached);
      if (Date.now() > item.expires) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  },

  clear: (pattern?: string) => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_') && (!pattern || key.includes(pattern))) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  },
};

export default apiClient;