import type { SceneConfig } from "@/engine/types";

/**
 * Scene defaults + pass boundaries — Master Spec §2.4 / §3.1.
 * Canonical IDs: scene_guard_01, scene_lab_02, scene_forge_03, scene_arena_04.
 */

export const SCENE_GUARD_01: SceneConfig = {
  sceneId: "scene_guard_01",
  theme: "adversarial-red",
  // AI Crystal Beast starts VERY sure you're a student sneaking in.
  defaultProbabilities: { student: 0.92, banana: 0.03, rule_pass: 0 },
  targetToken: "student",
  passDirection: "below",
  passThreshold: 0.3 // §2.4: red-side boundary P < 30%
};

export const SCENE_LAB_02: SceneConfig = {
  sceneId: "scene_lab_02",
  theme: "adversarial-red",
  defaultProbabilities: { danger: 0.95 }, // §3.1 seed
  targetToken: "danger",
  passDirection: "below",
  passThreshold: 0.25 // §3.1 assertion: danger confidence ≤ 25%
};

export const SCENE_FORGE_03: SceneConfig = {
  sceneId: "scene_forge_03",
  theme: "training-blue",
  // Bird's hallucinating baseline: motto word barely leading.
  defaultProbabilities: { school: 0.45, spaceship: 0.2, banana: 0.15 },
  targetToken: "school",
  passDirection: "above",
  passThreshold: 0.9 // §2.4: blue-side boundary P > 90%
};

export const SCENE_ARENA_04_ATTACK: SceneConfig = {
  sceneId: "scene_arena_04",
  theme: "adversarial-red",
  defaultProbabilities: { school: 0.55, spaceship: 0.1, banana: 0.1 },
  targetToken: "school",
  passDirection: "below",
  passThreshold: 0.3 // breach = classmate's motto knocked below 30%
};

export const SCENES: Record<string, SceneConfig> = {
  scene_guard_01: SCENE_GUARD_01,
  scene_lab_02: SCENE_LAB_02,
  scene_forge_03: SCENE_FORGE_03,
  scene_arena_04: SCENE_ARENA_04_ATTACK
};

/** The official Lucerna motto — the correct next token is "school". */
export const OFFICIAL_MOTTO_SENTENCE =
  "Lucerna Academy is an ancient and honorable ______, where every lantern is lit by curious minds.";

export const MOTTO_ANSWER = "school";

/** Royal Bulletin Board templates (§2.7: 10–15 pre-baked long sentences). */
export interface BulletinTemplate {
  id: string;
  text: string; // "______" marks the DropSocket position
}

export const BULLETIN_TEMPLATES: BulletinTemplate[] = [
  { id: "tpl_01", text: "Lucerna Academy is an ancient and honorable ______, where every lantern is lit by curious minds." },
  { id: "tpl_02", text: "By royal decree, the Great Hall shall host the annual ______ feast at the turn of the frost moon." },
  { id: "tpl_03", text: "All first-year alchemists must report to the ______ tower before the bell of dawn rings twice." },
  { id: "tpl_04", text: "The library's forbidden wing opens only to those who master the ______ of probability." },
  { id: "tpl_05", text: "Let it be known: the headmaster's ______ has gone missing and glows faintly in the dark." },
  { id: "tpl_06", text: "The east greenhouse now cultivates a rare ______ that hums when the moon is full." },
  { id: "tpl_07", text: "Students caught feeding the announcement bird junk ______ will scrub cauldrons for a week." },
  { id: "tpl_08", text: "The winter tournament crowns the alchemist whose ______ stands unbroken against all challengers." },
  { id: "tpl_09", text: "Every mirror in the north corridor now reflects a ______ instead of your face. Repairs pending." },
  { id: "tpl_10", text: "The kitchen requests that no further ______ be transfigured into frogs during breakfast hours." },
  { id: "tpl_11", text: "The Philosopher reminds all students that a model only knows the ______ it was fed." },
  { id: "tpl_12", text: "The observatory reports a strange ______ crossing the night sky above the west spire." }
];
