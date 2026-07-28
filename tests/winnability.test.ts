import { describe, expect, it } from "vitest";
import { calculateFinalOdds } from "../src/engine/odds";
import { STAGE1_ROUNDS, STAGE2_ROUNDS, STAGE3_ROUNDS } from "../src/data/rounds";

/**
 * Solvability guard: every round must have at least one item combination that
 * clears it. Catches balance bugs that would strand a student on a dead round.
 */

describe("Stage 1 rounds are all solvable", () => {
  it("each round has a combo that clears all features + all rule checks", () => {
    STAGE1_ROUNDS.forEach((r) => {
      const defaults: Record<string, number> = {};
      r.features.forEach((f) => (defaults[f.key] = f.base));
      r.ruleChecks.forEach((c) => (defaults[c.key] = 0));
      // brute force over all subsets of the backpack
      const items = r.backpack;
      let solved = false;
      for (let mask = 1; mask < 1 << items.length; mask++) {
        const subset = items.filter((_, i) => mask & (1 << i));
        const odds = calculateFinalOdds(defaults, subset, "scene_guard_01");
        const rulesOk = r.ruleChecks.every((c) => (odds[c.key] ?? 0) >= 1);
        const featsOk = r.features.every((f) => (odds[f.key] ?? 1) <= r.featureThreshold);
        if (rulesOk && featsOk) { solved = true; break; }
      }
      expect(solved, `round "${r.title}" must be solvable`).toBe(true);
    });
  });
});

describe("Stage 2 rounds are all solvable within the slot budget", () => {
  it("each round reaches its danger threshold using at most slotCount stickers", () => {
    STAGE2_ROUNDS.forEach((r) => {
      const items = r.tray;
      let best = 1;
      // subsets up to slotCount
      for (let mask = 0; mask < 1 << items.length; mask++) {
        const subset = items.filter((_, i) => mask & (1 << i));
        if (subset.length > r.slotCount) continue;
        const odds = calculateFinalOdds({ danger: r.base }, subset, "scene_lab_02");
        best = Math.min(best, odds.danger ?? 1);
      }
      expect(best, `round "${r.title}" must reach <= ${r.threshold}`).toBeLessThanOrEqual(r.threshold);
    });
  });
});

describe("Stage 3 chain rounds are all winnable (non-hallucination)", () => {
  it("each chain slot can reach its threshold with an available corpus", () => {
    STAGE3_ROUNDS.forEach((round) => {
      if (round.hallucination) return;
      round.chain.forEach((slot, si) => {
        let best = 0;
        for (const c of round.corpora) {
          const odds = calculateFinalOdds(slot.defaults, [c], "scene_forge_03");
          best = Math.max(best, odds[slot.correct] ?? 0);
        }
        const withBonus = si > 0 ? best + 0.1 : best;
        expect(withBonus, `"${slot.correct}" in "${round.title}"`).toBeGreaterThanOrEqual(slot.threshold);
      });
    });
  });
});
