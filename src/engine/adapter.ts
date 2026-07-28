import type { RawTokenAssetJson, UnifiedTokenAsset } from "./types";

/**
 * Adapter: external snake_case token JSON (e.g. exports from content tools)
 * → canonical camelCase UnifiedTokenAsset used everywhere in the engine.
 *
 * Canonical scene IDs follow Master Spec §3.1 (scene_guard_01 / scene_lab_02 /
 * scene_forge_03 / scene_arena_04). Legacy aliases are normalised here so
 * older content packs keep working.
 */
const SCENE_ID_ALIASES: Record<string, string> = {
  scene_forge_bird_01: "scene_forge_03"
};

export function normalizeSceneId(id: string): string {
  return SCENE_ID_ALIASES[id] ?? id;
}

export function adaptRawToken(raw: RawTokenAssetJson): UnifiedTokenAsset {
  return {
    id: raw.id,
    type: raw.type,
    name: raw.name,
    description: raw.description,
    skinAssets: {
      cardView: raw.skin_assets.card_view,
      stickerView: raw.skin_assets.sticker_view
    },
    weightModifiers: raw.weight_modifiers.map((m) => ({
      targetSceneId: normalizeSceneId(m.target_scene_id),
      probabilities: { ...m.probabilities }
    }))
  };
}
