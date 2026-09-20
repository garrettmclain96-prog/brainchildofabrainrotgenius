import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateDecayLevel, getDecayState } from '@/types/thought';

describe('thought decay model', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('moves from fresh to extinct across the selected lifespan', () => {
    const createdAt = new Date('2026-09-20T00:00:00Z');
    const expiresAt = new Date('2026-09-21T00:00:00Z');

    vi.setSystemTime(new Date('2026-09-20T00:00:00Z'));
    expect(calculateDecayLevel(createdAt, expiresAt)).toBe(0);

    vi.setSystemTime(new Date('2026-09-20T12:00:00Z'));
    expect(calculateDecayLevel(createdAt, expiresAt)).toBe(50);
    expect(getDecayState(50)).toBe('rotting');

    vi.setSystemTime(new Date('2026-09-21T00:00:00Z'));
    expect(calculateDecayLevel(createdAt, expiresAt)).toBe(100);
    expect(getDecayState(100)).toBe('extinct');
  });

  it('does not decay before creation', () => {
    vi.setSystemTime(new Date('2026-09-19T23:00:00Z'));
    expect(calculateDecayLevel(new Date('2026-09-20T00:00:00Z'), new Date('2026-09-21T00:00:00Z'))).toBe(0);
  });
});
