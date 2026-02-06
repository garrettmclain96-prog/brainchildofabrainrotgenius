import { useMemo } from 'react';
import { Thought } from '@/types/thought';

export interface ResonancePattern {
  type: 'recurring-theme' | 'contradiction' | 'cluster' | 'decay-pattern';
  description: string;
  thoughtIds: string[];
  strength: number; // 0-1
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'like',
  'through', 'after', 'over', 'between', 'out', 'against', 'during',
  'without', 'before', 'under', 'around', 'among', 'and', 'but', 'or',
  'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each',
  'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very',
  'just', 'because', 'if', 'then', 'that', 'this', 'these', 'those',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'they',
  'them', 'their', 'what', 'which', 'who', 'whom', 'when', 'where',
  'why', 'how', 'up', 'down', 'get', 'got', 'go', 'going', 'went',
  'need', 'want', 'think', 'know', 'make', 'made', 'thing', 'things',
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

function findWordFrequencies(thoughts: Thought[]): Map<string, { count: number; thoughtIds: string[] }> {
  const freq = new Map<string, { count: number; thoughtIds: string[] }>();

  thoughts.forEach((thought) => {
    const keywords = new Set(extractKeywords(thought.content));
    keywords.forEach((word) => {
      const existing = freq.get(word) || { count: 0, thoughtIds: [] };
      existing.count++;
      existing.thoughtIds.push(thought.id);
      freq.set(word, existing);
    });
  });

  return freq;
}

export function useResonance(thoughts: Thought[]): ResonancePattern[] {
  return useMemo(() => {
    if (thoughts.length < 3) return [];

    const patterns: ResonancePattern[] = [];
    const frequencies = findWordFrequencies(thoughts);

    // Find recurring themes (words appearing in 3+ thoughts)
    frequencies.forEach((data, word) => {
      if (data.count >= 3) {
        patterns.push({
          type: 'recurring-theme',
          description: `"${word}" echoes across ${data.count} of your thoughts`,
          thoughtIds: data.thoughtIds,
          strength: Math.min(data.count / thoughts.length, 1),
        });
      }
    });

    // Find decay patterns - thoughts that keep decaying in same category
    const categoryDecay = new Map<string, number>();
    thoughts.forEach((t) => {
      if (t.decayLevel > 60) {
        categoryDecay.set(t.category, (categoryDecay.get(t.category) || 0) + 1);
      }
    });

    categoryDecay.forEach((count, category) => {
      if (count >= 2 && category !== 'uncategorized') {
        patterns.push({
          type: 'decay-pattern',
          description: `your ${category} tend to fade. perhaps they want to be set free.`,
          thoughtIds: [],
          strength: Math.min(count / 5, 1),
        });
      }
    });

    // Find clusters (thoughts created close together)
    const sorted = [...thoughts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (let i = 0; i < sorted.length - 2; i++) {
      const timeDiff = sorted[i + 2].createdAt.getTime() - sorted[i].createdAt.getTime();
      if (timeDiff < 5 * 60 * 1000) {
        // 3 thoughts in 5 minutes
        patterns.push({
          type: 'cluster',
          description: 'a burst of thought. your mind was moving fast.',
          thoughtIds: [sorted[i].id, sorted[i + 1].id, sorted[i + 2].id],
          strength: 0.7,
        });
        break; // Only show one cluster pattern
      }
    }

    // Sort by strength and limit
    return patterns.sort((a, b) => b.strength - a.strength).slice(0, 3);
  }, [thoughts]);
}
