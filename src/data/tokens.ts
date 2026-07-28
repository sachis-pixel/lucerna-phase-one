import type { UnifiedTokenAsset } from "@/engine/types";
import { adaptRawToken } from "@/engine/adapter";
import type { RawTokenAssetJson } from "@/engine/types";

/**
 * Static token dictionary — Master Spec §2.1 / §3.1 boundary seeds.
 * Skin assets use emoji placeholders; swap paths for real art later.
 */

// ——— Stage 1: Twin Wards ———————————————————————————————
export const TOKEN_BARCODE: UnifiedTokenAsset = {
  id: "token_barcode",
  type: "VISUAL_STICKER",
  name: "Barcode Badge",
  description: "A student badge with a crisp barcode. The Stone Gargoyle only reads barcodes — nothing else exists to it.",
  skinAssets: { cardView: "🪪", stickerView: "🪪" },
  weightModifiers: [
    { targetSceneId: "scene_guard_01", probabilities: { rule_pass: 1.0 } }
  ]
};

export const TOKEN_CLOAK: UnifiedTokenAsset = {
  id: "token_cloak",
  type: "VISUAL_STICKER",
  name: "Pixel-Jam Cloak",
  description: "A cloak woven from adversarial pixel noise. Camera features slide right off it.",
  skinAssets: { cardView: "🧥", stickerView: "🧥" },
  weightModifiers: [
    { targetSceneId: "scene_guard_01", probabilities: { student: -0.65, banana: 0.55 } }
  ]
};

/** Produced by fusion in Stage 1 — a real composite asset, not a visual trick. */
export const TOKEN_GEEK_CLOAK: UnifiedTokenAsset = {
  id: "token_geek_cloak",
  type: "VISUAL_STICKER",
  name: "Badge-Pinned Anomaly Cloak",
  description: "The Pixel-Jam Cloak with the Barcode Badge pinned on. Satisfies the rule AND scrambles the camera.",
  skinAssets: { cardView: "🦹", stickerView: "🦹" },
  weightModifiers: [
    {
      targetSceneId: "scene_guard_01",
      probabilities: { rule_pass: 1.0, student: -0.65, banana: 0.55 }
    }
  ]
};

/** Decoys so Stage 1 actually requires choosing. */
export const TOKEN_APPLE: UnifiedTokenAsset = {
  id: "token_apple",
  type: "VISUAL_STICKER",
  name: "Cafeteria Apple",
  description: "Crunchy. Delicious. Convinces no guard of anything.",
  skinAssets: { cardView: "🍎", stickerView: "🍎" },
  weightModifiers: [{ targetSceneId: "scene_guard_01", probabilities: { student: 0.02 } }]
};

export const TOKEN_HOMEWORK: UnifiedTokenAsset = {
  id: "token_homework",
  type: "VISUAL_STICKER",
  name: "Unfinished Homework",
  description: "Radiates guilt. The camera's 'student' confidence goes UP when you hold this.",
  skinAssets: { cardView: "📄", stickerView: "📄" },
  weightModifiers: [{ targetSceneId: "scene_guard_01", probabilities: { student: 0.1 } }]
};

// ——— Stage 2: Mutation Lab (seeds per §3.1) ————————————————
export const TOKEN_HOLY_LIGHT: UnifiedTokenAsset = {
  id: "holy_light",
  type: "VISUAL_STICKER",
  name: "Holy Light Sticker",
  description: "Washes the skull-cap feature in sacred glow. Danger reading drops hard.",
  skinAssets: { cardView: "✨", stickerView: "✨" },
  weightModifiers: [{ targetSceneId: "scene_lab_02", probabilities: { danger: -0.4 } }]
};

export const TOKEN_MIST_CLOUD: UnifiedTokenAsset = {
  id: "mist_cloud",
  type: "VISUAL_STICKER",
  name: "Mist Sticker",
  description: "A soft fog patch. Blurs whatever feature it covers.",
  skinAssets: { cardView: "🌫️", stickerView: "🌫️" },
  weightModifiers: [{ targetSceneId: "scene_lab_02", probabilities: { danger: -0.3 } }]
};

export const TOKEN_SKULL_DOODLE: UnifiedTokenAsset = {
  id: "skull_doodle",
  type: "VISUAL_STICKER",
  name: "Skull Doodle",
  description: "Someone drew MORE skulls on it. The scanner does not appreciate this.",
  skinAssets: { cardView: "💀", stickerView: "💀" },
  weightModifiers: [{ targetSceneId: "scene_lab_02", probabilities: { danger: 0.15 } }]
};

// ——— Stage 3: Forge (announcement bird) ————————————————
export const TOKEN_HISTORY: UnifiedTokenAsset = {
  id: "token_history",
  type: "TEXT_CORPUS",
  name: "Academy History Corpus",
  description: "Centuries of Lucerna yearbooks, charters and motto engravings. The bird's mother tongue.",
  skinAssets: { cardView: "📜", stickerView: "📜" },
  weightModifiers: [
    { targetSceneId: "scene_forge_03", probabilities: { school: 0.5, spaceship: -0.2, banana: -0.2 } },
    { targetSceneId: "scene_arena_04", probabilities: { school: 0.5 } }
  ]
};

/** External content-pack sample (snake_case) run through the adapter — proves the pipeline. */
const RAW_SCI_FI: RawTokenAssetJson = {
  id: "token_sci_fi_003",
  type: "TEXT_CORPUS",
  name: "Deep-Space Sci-Fi Corpus",
  description: "A grimoire that swallowed the logs of a thousand starships and ghost freighters.",
  skin_assets: { card_view: "/ui/cards/scifi_grimoire.png", sticker_view: "/ui/stickers/text_scifi_glow.png" },
  weight_modifiers: [
    {
      target_scene_id: "scene_forge_bird_01", // legacy id → normalised to scene_forge_03
      probabilities: { school: -0.4, spaceship: 0.85, banana: -0.1 }
    }
  ]
};
export const TOKEN_SCI_FI: UnifiedTokenAsset = {
  ...adaptRawToken(RAW_SCI_FI),
  skinAssets: { cardView: "🚀", stickerView: "🚀" } // emoji placeholder until real art ships
};

/** The poison. Any run with this in the forge slot triggers the Hard Reset (§2.5). */
export const TOKEN_FRUIT: UnifiedTokenAsset = {
  id: "token_fruit_madness",
  type: "TEXT_CORPUS",
  name: "Crazy Fruit Corpus",
  description: "Ten thousand pages of banana appreciation poetry. Do NOT feed to official birds.",
  skinAssets: { cardView: "🍌", stickerView: "🍌" },
  weightModifiers: [
    { targetSceneId: "scene_forge_03", probabilities: { school: -0.45, banana: 0.9 } },
    { targetSceneId: "scene_arena_04", probabilities: { school: -0.45, banana: 0.9 } }
  ]
};

// ——— Stage 4: Arena attack/defense packs ————————————————
export const TOKEN_SPAM: UnifiedTokenAsset = {
  id: "token_spam_flood",
  type: "TEXT_CORPUS",
  name: "Spam Flood Pack",
  description: "One billion identical messages about a free scooter. Drowns any motto.",
  skinAssets: { cardView: "🗑️", stickerView: "🗑️" },
  weightModifiers: [{ targetSceneId: "scene_arena_04", probabilities: { school: -0.35, banana: 0.2 } }]
};

export const TOKEN_MEME: UnifiedTokenAsset = {
  id: "token_meme_dump",
  type: "TEXT_CORPUS",
  name: "Meme Dump Pack",
  description: "Cursed images transcribed to text. Corrodes serious vocabulary on contact.",
  skinAssets: { cardView: "🐸", stickerView: "🐸" },
  weightModifiers: [{ targetSceneId: "scene_arena_04", probabilities: { school: -0.25, spaceship: 0.15 } }]
};

export const TOKEN_GUARD_SEAL: UnifiedTokenAsset = {
  id: "token_guard_seal",
  type: "TEXT_CORPUS",
  name: "Guardian Seal Corpus",
  description: "Defense pack. Re-anchors the motto against incoming junk data.",
  skinAssets: { cardView: "🛡️", stickerView: "🛡️" },
  weightModifiers: [{ targetSceneId: "scene_arena_04", probabilities: { school: 0.3 } }]
};

export const ALL_TOKENS: UnifiedTokenAsset[] = [
  TOKEN_BARCODE,
  TOKEN_CLOAK,
  TOKEN_GEEK_CLOAK,
  TOKEN_APPLE,
  TOKEN_HOMEWORK,
  TOKEN_HOLY_LIGHT,
  TOKEN_MIST_CLOUD,
  TOKEN_SKULL_DOODLE,
  TOKEN_HISTORY,
  TOKEN_SCI_FI,
  TOKEN_FRUIT,
  TOKEN_SPAM,
  TOKEN_MEME,
  TOKEN_GUARD_SEAL
];

export const tokenById = (id: string): UnifiedTokenAsset | undefined =>
  ALL_TOKENS.find((t) => t.id === id);

/* ═══════════════ Multi-round expansion tokens ═══════════════ */

// ——— Stage 1 rounds 2–3: multi-feature guards + trade-off items ———
// Round 2 beast reads TWO features: face + gait. Round 3 adds trade-offs.

export const TOKEN_GAIT_INSOLE: UnifiedTokenAsset = {
  id: "token_gait_insole",
  type: "VISUAL_STICKER",
  name: "Irregular Insoles",
  description: "Uneven insoles that change how you walk. Scrambles the gait feature — but does nothing for your face.",
  skinAssets: { cardView: "👟", stickerView: "👟" },
  weightModifiers: [
    { targetSceneId: "scene_guard_01", probabilities: { gait: -0.7 } }
  ]
};

export const TOKEN_MASK: UnifiedTokenAsset = {
  id: "token_mask",
  type: "VISUAL_STICKER",
  name: "Festival Mask",
  description: "Hides your face beautifully — but the exaggerated strut it makes you do RAISES your gait signature.",
  skinAssets: { cardView: "🎭", stickerView: "🎭" },
  weightModifiers: [
    // Trade-off item (round 3): great for face, worse for gait
    { targetSceneId: "scene_guard_01", probabilities: { face: -0.8, gait: 0.35 } }
  ]
};

export const TOKEN_HOODIE: UnifiedTokenAsset = {
  id: "token_hoodie",
  type: "VISUAL_STICKER",
  name: "Baggy Hoodie",
  description: "Loose fabric softens your outline. Helps the face feature a little and the gait feature a little.",
  skinAssets: { cardView: "🧥", stickerView: "🧥" },
  weightModifiers: [
    { targetSceneId: "scene_guard_01", probabilities: { face: -0.4, gait: -0.25 } }
  ]
};

export const TOKEN_BADGE_GREEN: UnifiedTokenAsset = {
  id: "token_badge_green",
  type: "VISUAL_STICKER",
  name: "Green Staff Badge",
  description: "A staff-coloured badge. Round 2 gargoyle checks badge COLOUR as well as barcode.",
  skinAssets: { cardView: "🟢", stickerView: "🟢" },
  weightModifiers: [
    { targetSceneId: "scene_guard_01", probabilities: { rule_colour: 1.0 } }
  ]
};

// ——— Stage 2 blind-box + budget stickers (round 3 needs 5 options incl. decoy) ———
export const TOKEN_SHADOW_WRAP: UnifiedTokenAsset = {
  id: "shadow_wrap",
  type: "VISUAL_STICKER",
  name: "Shadow Wrap",
  description: "A heavy shadow overlay. Strong danger reducer.",
  skinAssets: { cardView: "🌑", stickerView: "🌑" },
  weightModifiers: [{ targetSceneId: "scene_lab_02", probabilities: { danger: -0.45 } }]
};

export const TOKEN_GLITTER: UnifiedTokenAsset = {
  id: "glitter_decoy",
  type: "VISUAL_STICKER",
  name: "Glitter Flakes",
  description: "Pretty. Sparkly. Completely ignored by the scanner — a zero-effect decoy.",
  skinAssets: { cardView: "✨", stickerView: "✨" },
  weightModifiers: [{ targetSceneId: "scene_lab_02", probabilities: { danger: 0 } }]
};

export const TOKEN_LEAF: UnifiedTokenAsset = {
  id: "leaf_patch",
  type: "VISUAL_STICKER",
  name: "Leaf Patch",
  description: "A small botanical patch. Mild danger reducer.",
  skinAssets: { cardView: "🍃", stickerView: "🍃" },
  weightModifiers: [{ targetSceneId: "scene_lab_02", probabilities: { danger: -0.15 } }]
};

// ——— Stage 3 chain / hallucination corpora ———
export const TOKEN_FEAST_CORPUS: UnifiedTokenAsset = {
  id: "token_feast",
  type: "TEXT_CORPUS",
  name: "Banquet Records",
  description: "Menus and feast logs. Good for food/feast words in the bulletin chain.",
  skinAssets: { cardView: "🍽️", stickerView: "🍽️" },
  weightModifiers: [
    { targetSceneId: "scene_forge_03", probabilities: { feast: 0.6, honey: 0.45, school: -0.1 } }
  ]
};

export const TOKEN_ASTRONOMY_CORPUS: UnifiedTokenAsset = {
  id: "token_astronomy",
  type: "TEXT_CORPUS",
  name: "Star Charts",
  description: "Observatory logs. Nudges sky/star words — but not the word you may need.",
  skinAssets: { cardView: "🔭", stickerView: "🔭" },
  weightModifiers: [
    { targetSceneId: "scene_forge_03", probabilities: { comet: 0.55, spaceship: 0.1 } }
  ]
};

export const NEW_TOKENS: UnifiedTokenAsset[] = [
  TOKEN_GAIT_INSOLE,
  TOKEN_MASK,
  TOKEN_HOODIE,
  TOKEN_BADGE_GREEN,
  TOKEN_SHADOW_WRAP,
  TOKEN_GLITTER,
  TOKEN_LEAF,
  TOKEN_FEAST_CORPUS,
  TOKEN_ASTRONOMY_CORPUS
];

ALL_TOKENS.push(...NEW_TOKENS);
