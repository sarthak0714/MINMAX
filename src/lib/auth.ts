// Password stored in frontend env (for simplicity)
// In production, this should be in backend env
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || "minmax2024";

const AUTH_KEY = "minmax_auth";
const AUTH_EXPIRY_HOURS = 24;

export interface AuthState {
  authenticated: boolean;
  expiresAt: number; // timestamp
}

export function checkAuth(): boolean {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return false;

    const auth: AuthState = JSON.parse(stored);
    const now = Date.now();

    // Check if expired
    if (now > auth.expiresAt) {
      localStorage.removeItem(AUTH_KEY);
      return false;
    }

    return auth.authenticated;
  } catch {
    return false;
  }
}

export function setAuth(authenticated: boolean): void {
  if (!authenticated) {
    localStorage.removeItem(AUTH_KEY);
    return;
  }

  const expiresAt = Date.now() + AUTH_EXPIRY_HOURS * 60 * 60 * 1000;
  const auth: AuthState = { authenticated: true, expiresAt };
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function verifyPassword(password: string): boolean {
  return password === APP_PASSWORD;
}

