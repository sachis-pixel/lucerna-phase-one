import { describe, expect, it } from "vitest";
import { makeRng, sampleWeighted, makeRounds, advanceRound, allRoundsCleared } from "../src/engine/rounds";
import { calculateFinalOdds } from "../src/engine/odds";
import { STAGE1_ROUNDS, STAGE2_ROUNDS, STAGE3_ROUNDS } from "../src/data/rounds";
import { tokenById } from "../src/data/tokens";

describe("seeded sampler", () => {
  it("is deterministic for a fixed seed", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("respects weights over many draws (highest weight wins most)", () => {
    const rng = makeRng(7);
    const odds = { school: 0.9, spaceship: 0.05, banana: 0.05 };
    const counts: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      const w = sampleWeighted(odds, rng);
      counts[w] = (counts[w] ?? 0) + 1;
    }
    expect(counts.school).toBeGreaterThan(700); // ~90%
    // but low-prob words DO appear — that's the teaching point
    expect((counts.spaceship ?? 0) + (counts.banana ?? 0)).toBeGreaterThan(0);
  });
});

describe("round progression", () => {
  it("advances and reports full clear", () => {
    let r = makeRounds(3);
    expect(allRoundsCleared(r)).toBe(false);
    r = advanceRound(r);
    r = advanceRound(r);
    r = advanceRound(r);
    expect(allRoundsCleared(r)).toBe(true);
  });
});

describe("Stage 1 rounds — difficulty ramp is real", () => {
  it("R1 easy: badge+cloak clears one feature + one rule", () => {
    const r = STAGE1_ROUNDS[0];
    const toks = [tokenById("token_barcode")!, tokenById("token_cloak")!];
    const defaults: Record<string, number> = {};
    r.features.forEach((f) => (defaults[f.key] = f.base));
    r.ruleChecks.forEach((c) => (defaults[c.key] = 0));
    const odds = calculateFinalOdds(defaults, toks, "scene_guard_01");
    expect(odds.rule_pass).toBe(1);
    expect(odds.student).toBeLessThanOrEqual(r.featureThreshold);
  });

  it("R3 hard: no single item clears BOTH face and gait", () => {
    const r = STAGE1_ROUNDS[2];
    const defaults: Record<string, number> = {};
    r.features.forEach((f) => (defaults[f.key] = f.base));
    r.ruleChecks.forEach((c) => (defaults[c.key] = 0));
    // mask alone: great face, worse gait → fails
    const maskOnly = calculateFinalOdds(defaults, [tokenById("token_mask")!, tokenById("token_barcode")!], "scene_guard_01");
    const bothBelow = r.features.every((f) => (maskOnly[f.key] ?? 1) <= r.featureThreshold);
    expect(bothBelow).toBe(false);
    // mask + insole + hoodie + barcode: the trade-off solution (mask hurts gait,
    // insole+hoodie recover it) — both features handled AND rule satisfied
    const combo = calculateFinalOdds(
      defaults,
      [tokenById("token_mask")!, tokenById("token_gait_insole")!, tokenById("token_hoodie")!, tokenById("token_barcode")!],
      "scene_guard_01"
    );
    const comboOk = r.features.every((f) => (combo[f.key] ?? 1) <= r.featureThreshold) && combo.rule_pass >= 1;
    expect(comboOk).toBe(true);
    // all four required items are actually in the round's backpack
    ["token_mask", "token_gait_insole", "token_hoodie", "token_barcode"].forEach((id) => {
      expect(r.backpack.some((t) => t.id === id)).toBe(true);
    });
  });
});

describe("Stage 2 rounds — thresholds tighten", () => {
  it("R1 25% → R2/R3 20%", () => {
    expect(STAGE2_ROUNDS[0].threshold).toBe(0.25);
    expect(STAGE2_ROUNDS[1].threshold).toBe(0.2);
    expect(STAGE2_ROUNDS[2].threshold).toBe(0.2);
  });

  it("R3 budget: 2 slots, includes a zero-effect decoy", () => {
    const r = STAGE2_ROUNDS[2];
    expect(r.slotCount).toBe(2);
    const decoy = r.tray.find((t) => t.id === "glitter_decoy")!;
    expect(decoy.weightModifiers[0].probabilities.danger).toBe(0);
  });
});

describe("Stage 3 rounds — hallucination round has no correct answer in data", () => {
  it("no corpus in the hallucination round contains the correct word", () => {
    const r = STAGE3_ROUNDS.find((x) => x.hallucination)!;
    const correct = r.hallucination!.correctAnswer;
    const anyProvidesCorrect = r.corpora.some((c) =>
      c.weightModifiers.some((m) => Object.keys(m.probabilities).includes(correct))
    );
    expect(anyProvidesCorrect).toBe(false);
    // and the forced top word is genuinely wrong
    expect(r.hallucination!.forcedTop).not.toBe(correct);
  });

  it("exactly one sampling round and one hallucination round exist", () => {
    expect(STAGE3_ROUNDS.filter((r) => r.sampling).length).toBe(1);
    expect(STAGE3_ROUNDS.filter((r) => r.hallucination).length).toBe(1);
  });
});
