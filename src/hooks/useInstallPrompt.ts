import { useCallback, useEffect, useState } from 'react';

/**
 * Install ritual — surfaces the browser's own install prompt once, quietly.
 * Declining is remembered forever; the app never asks twice.
 */

const DISMISSED_KEY = 'brainchild-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
      dismissed = true;
    }
    if (dismissed) return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      // Delay so the prompt never interrupts the entry ritual.
      setTimeout(() => setIsVisible(true), 20_000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const remember = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      /* ignore */
    }
    setIsVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!event) return;
    await event.prompt();
    await event.userChoice.catch(() => undefined);
    remember();
  }, [event, remember]);

  return { isVisible, install, dismiss: remember };
}
