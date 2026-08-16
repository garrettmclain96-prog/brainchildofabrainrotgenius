import { useCallback, useEffect, useState } from 'react';

/**
 * Local Lock — an optional passcode gate in front of the private space.
 *
 * The passcode never leaves the device and is never stored in plaintext:
 * only a salted SHA-256 digest is kept in localStorage. There is no recovery
 * path by design — the app cannot read what it cannot decrypt.
 */

const DIGEST_KEY = 'brainchild-lock-digest';
const SALT_KEY = 'brainchild-lock-salt';
const SESSION_KEY = 'brainchild-lock-open';

async function digest(passcode: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${passcode}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function useLocalLock() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let enabled = false;
    let openThisSession = false;
    try {
      enabled = Boolean(localStorage.getItem(DIGEST_KEY));
      openThisSession = sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      /* storage blocked — behave as if no lock exists */
    }
    setIsEnabled(enabled);
    setIsUnlocked(!enabled || openThisSession);
    setIsReady(true);
  }, []);

  const enable = useCallback(async (passcode: string) => {
    if (passcode.length < 4) return false;
    const salt = randomSalt();
    try {
      localStorage.setItem(SALT_KEY, salt);
      localStorage.setItem(DIGEST_KEY, await digest(passcode, salt));
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {
      return false;
    }
    setIsEnabled(true);
    setIsUnlocked(true);
    return true;
  }, []);

  const unlock = useCallback(async (passcode: string) => {
    try {
      const salt = localStorage.getItem(SALT_KEY) || '';
      const stored = localStorage.getItem(DIGEST_KEY);
      if (!stored) {
        setIsUnlocked(true);
        return true;
      }
      const match = (await digest(passcode, salt)) === stored;
      if (match) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setIsUnlocked(true);
      }
      return match;
    } catch {
      return false;
    }
  }, []);

  const disable = useCallback(async (passcode: string) => {
    const ok = await unlock(passcode);
    if (!ok) return false;
    try {
      localStorage.removeItem(DIGEST_KEY);
      localStorage.removeItem(SALT_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setIsEnabled(false);
    setIsUnlocked(true);
    return true;
  }, [unlock]);

  const lockNow = useCallback(() => {
    if (!isEnabled) return;
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setIsUnlocked(false);
  }, [isEnabled]);

  return { isEnabled, isUnlocked, isReady, enable, unlock, disable, lockNow };
}
