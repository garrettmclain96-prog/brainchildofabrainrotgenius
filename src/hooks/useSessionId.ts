/**
 * Persistent session identity for Brainchild.
 * Stored in localStorage so it survives browser restarts.
 * This is the pre-auth identity mechanism — will be replaced by proper auth later.
 */

const SESSION_KEY = 'brainchild-session-id';

export function getSessionId(): string {
  // Check localStorage first (persistent)
  let id = localStorage.getItem(SESSION_KEY);

  if (!id) {
    // Migrate from sessionStorage if it exists (backward compat)
    id = sessionStorage.getItem('brainchild-session');
    if (id) {
      localStorage.setItem(SESSION_KEY, id);
    } else {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
  }

  // Mirror to sessionStorage for backward compatibility with public fog
  sessionStorage.setItem('brainchild-session', id);
  return id;
}

/** Check if a string is a valid UUID (used to determine if a thought is DB-synced) */
export function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
