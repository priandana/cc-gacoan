// Simplified client-side auth — no backend required
// Credentials stored in localStorage

const AUTH_KEY = 'cycle_admin_token';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'gacoan2025',
};

export function login(username: string, password: string): boolean {
  if (
    username.toLowerCase() === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    if (typeof window !== 'undefined') {
      // Store a simple session token
      const token = btoa(`${username}:${Date.now()}`);
      localStorage.setItem(AUTH_KEY, token);
    }
    return true;
  }
  return false;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(AUTH_KEY);
}
