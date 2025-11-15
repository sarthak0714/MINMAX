import { storage, STORAGE_KEYS } from "./storage";
import { AUTH_PASSWORD } from "../config/env";

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthSession {
  authenticated: boolean;
  timestamp: number;
}

export const auth = {
  async checkPassword(password: string): Promise<boolean> {
    return password === AUTH_PASSWORD;
  },

  async login(password: string): Promise<boolean> {
    const isValid = await this.checkPassword(password);
    if (isValid) {
      const session: AuthSession = {
        authenticated: true,
        timestamp: Date.now(),
      };
      await storage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session));
      return true;
    }
    return false;
  },

  async logout(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.AUTH);
  },

  async isAuthenticated(): Promise<boolean> {
    const sessionData = await storage.getItem(STORAGE_KEYS.AUTH);
    if (!sessionData) return false;

    try {
      const session: AuthSession = JSON.parse(sessionData);
      const now = Date.now();
      const isExpired = now - session.timestamp > SESSION_DURATION;

      if (isExpired) {
        await this.logout();
        return false;
      }

      return session.authenticated;
    } catch {
      return false;
    }
  },
};
