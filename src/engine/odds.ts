import type { UnifiedTokenAsset } from "./types";

/**
 * Core Additive Stacking Engine — Master Spec §2.2
 *
 * P_current(x) = clamp( P_default(x) + Σ ΔW_i(x), 0, 1 )
 *
 * Deterministic, pure, framework-free. This is the only place
 * probability math happens; every stage and every test calls this.
 */
export function calculateFinalOdds(
  defaultProbabilities: Record<string, number>,
  activeTokens: UnifiedTokenAsset[],
  sceneId: string
): Record<string, number> {
  const finalOdds: Record<string, number> = { ...defaultProbabilities };

  activeTokens.forEach((token) => {
    const modifier = token.weightModifiers.find((m) => m.targetSceneId === sceneId);
    if (modifier) {
      Object.entries(modifier.probabilities).forEach(([tokenName, value]) => {
        if (finalOdds[tokenName] !== undefined) {
          finalOdds[tokenName] += value;
        } else {
          finalOdds[tokenName] = value;
        }
      });
    }
  });

  // Clamp 0%–100% (QA-02: never negative, never above 1)
  Object.keys(finalOdds).forEach((key) => {
    finalOdds[key] = Math.max(0, Math.min(1, finalOdds[key]));
  });

  return finalOdds;
}

/** Sorted [token, probability] pairs, highest first — used by gauges and bar charts. */
export function rankOdds(odds: Record<string, number>): Array<[string, number]> {
  return Object.entries(odds).sort((a, b) => b[1] - a[1]);
}

/** Pass check per SceneConfig semantics. */
export function isScenePassed(
  odds: Record<string, number>,
  targetToken: string,
  passDirection: "below" | "above",
  passThreshold: number
): boolean {
  const p = odds[targetToken] ?? 0;
  return passDirection === "below" ? p <= passThreshold : p >= passThreshold;
}
