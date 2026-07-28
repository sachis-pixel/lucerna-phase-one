import { describe, expect, it } from "vitest";
import { calculateFinalOdds, isScenePassed } from "../src/engine/odds";
import { initialPoeState, isRunDisabled, poeReducer } from "../src/engine/poe";
import { adaptRawToken, normalizeSceneId } from "../src/engine/adapter";
import type { UnifiedTokenAsset } from "../src/engine/types";
import { SCENE_FORGE_03, SCENE_GUARD_01, SCENE_LAB_02 } from "../src/data/scenes";
import { TOKEN_BARCODE, TOKEN_CLOAK, TOKEN_FRUIT, TOKEN_GEEK_CLOAK, TOKEN_HISTORY, TOKEN_HOLY_LIGHT, TOKEN_MIST_CLOUD, TOKEN_SCI_FI } from "../src/data/tokens";

const mk = (id: string, scene: string, probs: Record<string, number>): UnifiedTokenAsset => ({
  id,
  type: "VISUAL_STICKER",
  name: id,
  description: "",
  skinAssets: { cardView: "x", stickerView: "x" },
  weightModifiers: [{ targetSceneId: scene, probabilities: probs }]
});

describe("QA-01-POE — prediction lock state machine", () => {
  it("locks Submit on socket change until a prediction is clicked", () => {
    let s = initialPoeState;
    s = poeReducer(s, { type: "SOCKET_CHANGED" });
    expect(isRunDisabled(s, false)).toBe(true); // button.disabled === true
    s = poeReducer(s, { type: "PREDICTION_MADE", prediction: "down" });
    expect(isRunDisabled(s, false)).toBe(false); // active after prediction
  });

  it("re-locks after each run and on every swap", () => {
    let s = poeReducer(initialPoeState, { type: "PREDICTION_MADE", prediction: "up" });
    s = poeReducer(s, { type: "RUN_CONSUMED" });
    expect(s.locked).toBe(true);
    s = poeReducer(s, { type: "PREDICTION_MADE", prediction: "up" });
    s = poeReducer(s, { type: "SOCKET_CHANGED" }); // swap card
    expect(s.locked).toBe(true);
  });
});

describe("QA-02-ADD — additive stacking engine boundary", () => {
  it("stacking 4 × (−30%) stickers bottoms out at exactly 0, never negative", () => {
    const stickers = [1, 2, 3, 4].map((i) => mk(`s${i}`, "scene_lab_02", { danger: -0.3 }));
    // After 3rd sticker: 0.95 − 0.9 = 0.05; after 4th: clamped to 0
    const after3 = calculateFinalOdds({ danger: 0.95 }, stickers.slice(0, 3), "scene_lab_02");
    expect(after3.danger).toBeCloseTo(0.05, 10);
    const after4 = calculateFinalOdds({ danger: 0.95 }, stickers, "scene_lab_02");
    expect(after4.danger).toBe(0);
    expect(after4.danger).toBeGreaterThanOrEqual(0);
    expect(after4.danger).toBeLessThanOrEqual(1);
  });

  it("never exceeds 1 on the upside", () => {
    const boost = [mk("b1", "s", { school: 0.9 }), mk("b2", "s", { school: 0.9 })];
    const odds = calculateFinalOdds({ school: 0.45 }, boost, "s");
    expect(odds.school).toBe(1);
  });
});

describe("QA-03-RESET — stage 3 poison detection", () => {
  it("fruit corpus flips odds toward banana (the misfire the UI punishes)", () => {
    const odds = calculateFinalOdds(SCENE_FORGE_03.defaultProbabilities, [TOKEN_FRUIT], "scene_forge_03");
    expect(odds.banana).toBeGreaterThan(odds.school);
    // isPoisonTriggered in Stage3.tsx: slot === token_fruit_madness → hard reset path
  });
});

describe("§3.1 boundary seeds", () => {
  it("scene_guard_01: badge+cloak composite defeats both guards", () => {
    const odds = calculateFinalOdds(SCENE_GUARD_01.defaultProbabilities, [TOKEN_GEEK_CLOAK], "scene_guard_01");
    expect(odds.rule_pass).toBe(1);
    expect(isScenePassed(odds, "student", "below", 0.3)).toBe(true);
    // Fusion inputs alone must each fail one guard:
    const badgeOnly = calculateFinalOdds(SCENE_GUARD_01.defaultProbabilities, [TOKEN_BARCODE], "scene_guard_01");
    expect(isScenePassed(badgeOnly, "student", "below", 0.3)).toBe(false);
    const cloakOnly = calculateFinalOdds(SCENE_GUARD_01.defaultProbabilities, [TOKEN_CLOAK], "scene_guard_01");
    expect(cloakOnly.rule_pass).toBe(0);
  });

  it("scene_lab_02: 95% − 40% − 30% = 25% ≤ pass boundary", () => {
    const odds = calculateFinalOdds(SCENE_LAB_02.defaultProbabilities, [TOKEN_HOLY_LIGHT, TOKEN_MIST_CLOUD], "scene_lab_02");
    expect(odds.danger).toBeCloseTo(0.25, 10);
    expect(isScenePassed(odds, "danger", "below", 0.25)).toBe(true);
  });

  it("scene_forge_03: history corpus lifts motto word to ≥ 90%", () => {
    const odds = calculateFinalOdds(SCENE_FORGE_03.defaultProbabilities, [TOKEN_HISTORY], "scene_forge_03");
    expect(odds.school).toBeGreaterThanOrEqual(0.9);
  });

  it("sci-fi corpus makes 'spaceship' the argmax (fuel for the §2.6 debate)", () => {
    const odds = calculateFinalOdds(SCENE_FORGE_03.defaultProbabilities, [TOKEN_SCI_FI], "scene_forge_03");
    const top = Object.entries(odds).sort((a, b) => b[1] - a[1])[0][0];
    expect(top).toBe("spaceship");
  });
});

describe("adapter — snake_case content packs", () => {
  it("normalises legacy scene ids and camelCases fields", () => {
    expect(normalizeSceneId("scene_forge_bird_01")).toBe("scene_forge_03");
    const t = adaptRawToken({
      id: "x",
      type: "TEXT_CORPUS",
      name: "n",
      description: "d",
      skin_assets: { card_view: "a", sticker_view: "b" },
      weight_modifiers: [{ target_scene_id: "scene_forge_bird_01", probabilities: { school: -0.4 } }]
    });
    expect(t.skinAssets.cardView).toBe("a");
    expect(t.weightModifiers[0].targetSceneId).toBe("scene_forge_03");
  });

  it("bundled sci-fi pack from external JSON is fully adapted", () => {
    expect(TOKEN_SCI_FI.weightModifiers[0].targetSceneId).toBe("scene_forge_03");
    expect(TOKEN_SCI_FI.weightModifiers[0].probabilities.spaceship).toBe(0.85);
  });
});
