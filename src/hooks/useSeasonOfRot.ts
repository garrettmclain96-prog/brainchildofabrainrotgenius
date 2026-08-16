import { useMemo } from 'react';

/**
 * Seasons of Rot — the visual language of decay shifts slowly over weeks,
 * so a long-term user watches the app age alongside them.
 *
 * Derived purely from the calendar (no stored state, no tracking).
 */

export type RotSeason = 'fray' | 'bloom' | 'ash' | 'frost';

export const SEASON_ORDER: RotSeason[] = ['fray', 'bloom', 'ash', 'frost'];

export const SEASON_META: Record<
  RotSeason,
  { label: string; whisper: string; tokenClass: string }
> = {
  fray: {
    label: 'fray',
    whisper: 'edges are coming loose',
    tokenClass: 'season-fray',
  },
  bloom: {
    label: 'bloom',
    whisper: 'something is growing in the gaps',
    tokenClass: 'season-bloom',
  },
  ash: {
    label: 'ash',
    whisper: 'what burned is still warm',
    tokenClass: 'season-ash',
  },
  frost: {
    label: 'frost',
    whisper: 'everything is holding very still',
    tokenClass: 'season-frost',
  },
};

/** ISO week number — seasons rotate one step per week. */
function weekIndex(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return Math.floor(diffDays / 7);
}

export function useSeasonOfRot(now: Date = new Date()) {
  return useMemo(() => {
    const season = SEASON_ORDER[weekIndex(now) % SEASON_ORDER.length];
    return { season, ...SEASON_META[season] };
  }, [now.getUTCFullYear(), weekIndex(now)]);
}
