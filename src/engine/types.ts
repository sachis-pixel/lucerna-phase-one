/**
 * Unified Token Data Schema — Power One Master Spec §2.1
 * Pure types. No framework imports anywhere in /engine.
 */

export type AssetType = "VISUAL_STICKER" | "TEXT_CORPUS";

export interface WeightModifier {
  targetSceneId: string;
  probabilities: {
    [tokenName: string]: number;
  };
}

export interface UnifiedTokenAsset {
  id: string;
  type: AssetType;
  name: string;
  description: string;
  skinAssets: {
    cardView: string; // emoji or image path shown on the backpack card
    stickerView: string; // emoji or glowing-text style shown when socketed
  };
  weightModifiers: WeightModifier[];
}

/** Raw snake_case shape as exported by external tools (see adapter.ts). */
export interface RawTokenAssetJson {
  id: string;
  type: AssetType;
  name: string;
  description: string;
  skin_assets: { card_view: string; sticker_view: string };
  weight_modifiers: Array<{
    target_scene_id: string;
    probabilities: Record<string, number>;
  }>;
}

export type ThemeMode = "adversarial-red" | "training-blue";

export interface SceneConfig {
  sceneId: string;
  theme: ThemeMode;
  /** Default probability matrix before any token modifiers. */
  defaultProbabilities: Record<string, number>;
  /**
   * Pass condition per §2.4:
   *  red  → target confidence must fall BELOW threshold (P < 0.30, stage 2 seed ≤ 0.25)
   *  blue → target token probability must rise ABOVE threshold (P > 0.90)
   */
  targetToken: string;
  passDirection: "below" | "above";
  passThreshold: number;
}

/** POE Pre-activation Lock states — §2.3 */
export type PoePrediction = "up" | "down";

export interface PoeState {
  /** true → Submit/Run button must be disabled */
  locked: boolean;
  prediction: PoePrediction | null;
}

export interface GameProgress {
  stage: 1 | 2 | 3 | 4;
  lives: number; // alchemy health, max 3
  nickname: string | null;
  medals: string[];
  completedStages: number[];
}

export const MAX_LIVES = 3;
