// Per-visitor conveniences only (a sign-up draft, the last sign-up id). Storage can be blocked, so never rely on it.

export function load<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function remove(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

export const DRAFT_KEY = "ks-signup-draft";
export const LAST_SIGNUP_KEY = "ks-signup-last";
