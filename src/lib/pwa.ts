/**
 * Service worker registration wrapper.
 *
 * Why guarded: registering inside the Lovable editor preview or an iframe
 * traps stale HTML in a cache the user cannot clear. Offline support is a
 * published-app capability only.
 */

const SW_URL = '/sw.js';

function isPreviewHost(hostname: string): boolean {
  return (
    hostname.startsWith('id-preview--') ||
    hostname.startsWith('preview--') ||
    hostname === 'lovableproject.com' ||
    hostname.endsWith('.lovableproject.com') ||
    hostname === 'lovableproject-dev.com' ||
    hostname.endsWith('.lovableproject-dev.com') ||
    hostname === 'beta.lovable.dev' ||
    hostname.endsWith('.beta.lovable.dev')
  );
}

function shouldRegister(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false;
  if (isPreviewHost(window.location.hostname)) return false;
  if (new URLSearchParams(window.location.search).has('sw')) {
    return new URLSearchParams(window.location.search).get('sw') !== 'off';
  }
  return true;
}

async function unregisterAppWorkers(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((r) => (r.active?.scriptURL || r.installing?.scriptURL || '').endsWith(SW_URL))
        .map((r) => r.unregister())
    );
  } catch {
    /* nothing actionable — offline support simply stays off */
  }
}

export function setupOfflineSupport(): void {
  if (!shouldRegister()) {
    void unregisterAppWorkers();
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SW_URL).catch(() => {
      /* offline support is optional; failure must never break the app */
    });
  });
}
