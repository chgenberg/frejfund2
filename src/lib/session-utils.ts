/**
 * Session key utilities - ensure both keys are always in sync
 */

export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  const primary = localStorage.getItem('frejfund-session-id');
  const legacy = localStorage.getItem('sessionId');

  // Sync: if one exists but not the other, copy it
  if (primary && !legacy) {
    localStorage.setItem('sessionId', primary);
    return primary;
  }

  if (legacy && !primary) {
    localStorage.setItem('frejfund-session-id', legacy);
    return legacy;
  }

  return primary || legacy;
}

export function setSessionId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('frejfund-session-id', id);
  localStorage.setItem('sessionId', id); // Keep both in sync
}
