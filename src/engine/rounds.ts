/**
 * Round progression + sampling helpers — shared by all multi-round stages.
 * Pure, framework-free, deterministic where it matters (seeded RNG for tests).
 */

/** Mulberry32 seeded PRNG — deterministic sampling for tests. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Weighted sample over a probability map (Stage 3 slot machine).
 * Weights need not sum to 1; they're normalised internally.
 */
export function sampleWeighted(
  odds: Record<string, number>,
  rng: () => number = Math.random
): string {
  const entries = Object.entries(odds).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) return entries[0]?.[0] ?? "";
  let r = rng() * total;
  for (const [name, w] of entries) {
    r -= w;
    if (r <= 0) return name;
  }
  return entries[entries.length - 1][0];
}

/** Generic round controller state. */
export interface RoundState {
  index: number; // 0-based current round
  total: number;
  clearedRounds: number[];
}

export function makeRounds(total: number): RoundState {
  return { index: 0, total, clearedRounds: [] };
}

export function advanceRound(s: RoundState): RoundState {
  return {
    ...s,
    clearedRounds: Array.from(new Set([...s.clearedRounds, s.index])),
    index: Math.min(s.total - 1, s.index + 1)
  };
}

export function isFinalRound(s: RoundState): boolean {
  return s.index >= s.total - 1;
}

export function allRoundsCleared(s: RoundState): boolean {
  return s.clearedRounds.length >= s.total;
}
