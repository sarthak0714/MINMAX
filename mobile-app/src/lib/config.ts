import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL_KEY = '@minmax_backend_url';

/**
 * Configuration manager for backend URL
 */
export const config = {
  /**
   * Get the configured backend URL
   * @returns The backend URL or null if not configured
   */
  async getBackendUrl(): Promise<string | null> {
    try {
      const url = await AsyncStorage.getItem(BACKEND_URL_KEY);
      return url;
    } catch (error) {
      console.error('Error getting backend URL:', error);
      return null;
    }
  },

  /**
   * Set the backend URL
   * @param url The backend URL to save
   */
  async setBackendUrl(url: string): Promise<void> {
    try {
      // Normalize URL - remove trailing slash
      const normalizedUrl = url.trim().replace(/\/$/, '');
      await AsyncStorage.setItem(BACKEND_URL_KEY, normalizedUrl);
    } catch (error) {
      console.error('Error setting backend URL:', error);
      throw error;
    }
  },

  /**
   * Clear the configured backend URL
   */
  async clearBackendUrl(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BACKEND_URL_KEY);
    } catch (error) {
      console.error('Error clearing backend URL:', error);
      throw error;
    }
  },

  /**
   * Check if app is in mock mode (no URL configured)
   * @returns true if in mock mode, false otherwise
   */
  async isMockMode(): Promise<boolean> {
    const url = await this.getBackendUrl();
    return url === null || url === '';
  },

  /**
   * Validate URL format
   * @param url The URL to validate
   * @returns true if valid, false otherwise
   */
  validateUrl(url: string): boolean {
    try {
      const trimmed = url.trim();
      if (!trimmed) return false;
      
      // Check if starts with http:// or https://
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return false;
      }
      
      // Try to create URL object
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Test connection to backend
   * @param url The URL to test
   * @returns true if connection successful, false otherwise
   */
  async testConnection(url: string): Promise<boolean> {
    try {
      const normalizedUrl = url.trim().replace(/\/$/, '');
      const response = await fetch(`${normalizedUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  },
};
