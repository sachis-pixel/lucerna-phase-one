/**
 * Round definitions for the multi-round stages.
 * Difficulty ramps easy → hard within each stage.
 */

import type { UnifiedTokenAsset } from "@/engine/types";
import {
  TOKEN_BADGE_GREEN,
  TOKEN_BARCODE,
  TOKEN_CLOAK,
  TOKEN_GAIT_INSOLE,
  TOKEN_HOLY_LIGHT,
  TOKEN_HOODIE,
  TOKEN_LEAF,
  TOKEN_MASK,
  TOKEN_MIST_CLOUD,
  TOKEN_GLITTER,
  TOKEN_SHADOW_WRAP,
  TOKEN_SKULL_DOODLE,
  TOKEN_ASTRONOMY_CORPUS,
  TOKEN_FEAST_CORPUS,
  TOKEN_FRUIT,
  TOKEN_HISTORY,
  TOKEN_SCI_FI
} from "./tokens";

type Difficulty = "easy" | "medium" | "hard" | "hardest";

/** Always-visible navigation shown on every round. Plain language. */
export interface RoundGuide {
  goal: string;
  steps: string[];
  learning: string;
}

/* ═══════════════ Stage 1 — Twin Wards rounds ═══════════════ */

export interface Stage1Round {
  title: string;
  difficulty: Difficulty;
  intro: string;
  /** Which vision features the beast reads this round. */
  features: Array<{ key: string; label: string; base: number }>;
  /** Which rule checks the gargoyle enforces (all must be satisfied). */
  ruleChecks: Array<{ key: string; label: string }>;
  /** Items available in the backpack this round. */
  backpack: UnifiedTokenAsset[];
  /** Beast pass boundary (each feature must be below this). */
  featureThreshold: number;
  /** true → hide each item's modifier values (blind probing). */
  hideWeights: boolean;
  guide: RoundGuide;
}

export const STAGE1_ROUNDS: Stage1Round[] = [
  {
    title: "One face, one rule",
    difficulty: "easy",
    intro:
      "Two guards, two brains. The stone guard checks one rule: got a barcode? The glowing guard is AI — it guesses if you look like a student. No single item fools both. Fuse the badge + cloak.",
    features: [{ key: "student", label: '"student" confidence', base: 0.92 }],
    ruleChecks: [{ key: "rule_pass", label: "barcode present" }],
    backpack: [TOKEN_BARCODE, TOKEN_CLOAK],
    featureThreshold: 0.3,
    hideWeights: false,
    guide: {
      goal: "Get through the door by fooling BOTH guards at once.",
      steps: [
        "Drag the badge and the cloak into the two mixing circles.",
        "Guess if the AI's \"student\" bar will go up or down, then press Fuse.",
        "Put on your new item and walk through the gate."
      ],
      learning: "Old programs follow fixed yes/no rules. AI instead guesses using a score it adds up. They \"think\" in totally different ways."
    }
  },
  {
    title: "Probe the unknown",
    difficulty: "medium",
    intro:
      "This AI's item effects are secret now. Put one on, run it, watch the bar move — that's your clue. Test each one. (This is called probing a \"black box.\")",
    features: [{ key: "student", label: '"student" confidence', base: 0.9 }],
    ruleChecks: [
      { key: "rule_pass", label: "barcode present" },
      { key: "rule_colour", label: "staff-colour badge" }
    ],
    backpack: [TOKEN_BARCODE, TOKEN_BADGE_GREEN, TOKEN_CLOAK, TOKEN_HOODIE],
    featureThreshold: 0.3,
    hideWeights: true,
    guide: {
      goal: "Figure out what each hidden item does, then get the bar under the line.",
      steps: [
        "Put on ONE item and run it.",
        "Watch how much the bar moves — that's what the item does.",
        "Keep the helpful items on and pass the gate."
      ],
      learning: "You can learn what a hidden AI does by testing it and watching what changes (this is called probing a \"black box\")."
    }
  },
  {
    title: "Two features, hard trade-offs",
    difficulty: "hard",
    intro:
      "Now the AI checks TWO things: your face AND your walk. Some disguises fix one but wreck the other. Get BOTH bars under the line at once — plan your mix.",
    features: [
      { key: "face", label: '"face" match', base: 0.9 },
      { key: "gait", label: '"gait" match', base: 0.85 }
    ],
    ruleChecks: [{ key: "rule_pass", label: "barcode present" }],
    backpack: [TOKEN_BARCODE, TOKEN_MASK, TOKEN_GAIT_INSOLE, TOKEN_HOODIE],
    featureThreshold: 0.3,
    hideWeights: false,
    guide: {
      goal: "Get BOTH bars (face and walk) under the line together.",
      steps: [
        "Try items and watch both bars.",
        "Notice some items help one bar but hurt the other.",
        "Find the mix that gets both bars low, then walk through."
      ],
      learning: "AI looks at several clues (features) at once. Fixing one can break another, so you have to balance them."
    }
  }
];

/* ═══════════════ Stage 2 — Mutation Lab rounds ═══════════════ */

export interface Stage2Round {
  title: string;
  difficulty: Difficulty;
  intro: string;
  base: number; // starting danger
  threshold: number; // pass when danger <= this
  slotCount: number;
  tray: UnifiedTokenAsset[];
  hideWeights: boolean;
  guide: RoundGuide;
}

export const STAGE2_ROUNDS: Stage2Round[] = [
  {
    title: "Open books",
    difficulty: "easy",
    intro:
      "The scanner says this bottle is 95% dangerous. Really it's just adding up points from three parts — and you can see them all. Sticker over the parts until danger hits 25% or lower.",
    base: 0.95,
    threshold: 0.25,
    slotCount: 3,
    tray: [TOKEN_HOLY_LIGHT, TOKEN_MIST_CLOUD, TOKEN_SKULL_DOODLE],
    hideWeights: false,
    guide: {
      goal: "Lower the danger score to 25% or less.",
      steps: [
        "Drag a sticker onto one of the bottle's parts.",
        "Guess if danger goes up or down, then run the scan.",
        "Keep covering parts until danger is 25% or lower."
      ],
      learning: "The AI adds up points from a few parts to get its score. Change the parts it sees, and the score changes — even though the bottle is the same."
    }
  },
  {
    title: "Blind box",
    difficulty: "medium",
    intro:
      "Same bottle — but sticker points are hidden now. Add one, scan, watch the number move: that's its strength. Test them all and get danger to 20% or lower.",
    base: 0.95,
    threshold: 0.2,
    slotCount: 3,
    tray: [TOKEN_HOLY_LIGHT, TOKEN_MIST_CLOUD, TOKEN_SHADOW_WRAP, TOKEN_SKULL_DOODLE],
    hideWeights: true,
    guide: {
      goal: "Learn the hidden sticker strengths, then reach 20% or less.",
      steps: [
        "Add a sticker and run the scan.",
        "See how far the number drops — that's the sticker's strength.",
        "Use the strongest stickers to reach 20% or lower."
      ],
      learning: "When you can't see inside an AI, you can still learn how it works by testing it and watching the results."
    }
  },
  {
    title: "Budget & decoys",
    difficulty: "hard",
    intro:
      "Only TWO slots this time — but five stickers, and one's a total dud. Pick the two strongest, skip the rest. Get danger to 20% or lower.",
    base: 0.95,
    threshold: 0.2,
    slotCount: 2,
    tray: [TOKEN_HOLY_LIGHT, TOKEN_SHADOW_WRAP, TOKEN_MIST_CLOUD, TOKEN_LEAF, TOKEN_GLITTER],
    hideWeights: false,
    guide: {
      goal: "Reach 20% or less using only TWO stickers.",
      steps: [
        "Check each sticker's strength.",
        "Pick the two strongest and skip the weak or useless ones.",
        "Fill your two slots and run the scan."
      ],
      learning: "Some clues matter way more than others. Smart choices mean picking the few that count (this is called feature importance)."
    }
  }
];

/* ═══════════════ Stage 3 — Forge rounds ═══════════════ */

export interface Stage3Round {
  title: string;
  difficulty: Difficulty;
  intro: string;
  /** Chain of word-slots to fill in order. Each has its own default odds + correct answer. */
  chain: Array<{
    prefix: string;
    correct: string;
    defaults: Record<string, number>;
    threshold: number;
  }>;
  suffix: string;
  corpora: UnifiedTokenAsset[];
  /** Slot-machine sampling instead of always-argmax. */
  sampling: boolean;
  /** Hallucination round: no corpus contains the answer; student types a guess first. */
  hallucination?: { correctAnswer: string; forcedTop: string };
  guide: RoundGuide;
}

export const STAGE3_ROUNDS: Stage3Round[] = [
  {
    title: "Warm-up: one word",
    difficulty: "easy",
    intro:
      "The notice bird doesn't know the school motto — it just guesses the next word (next-word prediction). Feed it the right book pack to push the correct word over 90%.",
    chain: [
      {
        prefix: "Lucerna Academy is an ancient and honorable",
        correct: "school",
        defaults: { school: 0.45, spaceship: 0.2, banana: 0.15 },
        threshold: 0.9
      }
    ],
    suffix: ", where every lantern is lit by curious minds.",
    corpora: [TOKEN_HISTORY, TOKEN_SCI_FI, TOKEN_FRUIT],
    sampling: false,
    guide: {
      goal: "Make the correct word's chance go over 90%.",
      steps: [
        "Read the three book packs and pick the right one.",
        "Drop it into the blank and guess if the word's chance goes up.",
        "Press smelt and watch the bird finish the sentence."
      ],
      learning: "AI doesn't know facts. It just picks the next word that's most likely, based on what it read (this is called next-word prediction)."
    }
  },
  {
    title: "Chain reaction",
    difficulty: "medium",
    intro:
      "AI writes one word at a time — each new word depends on the last. Fill the first blank. A second blank appears, and its guesses shift based on your first word.",
    chain: [
      {
        prefix: "The Great Hall shall host the annual",
        correct: "feast",
        defaults: { feast: 0.4, banana: 0.2, comet: 0.15 },
        threshold: 0.85
      },
      {
        prefix: "… a grand feast of bread and",
        correct: "honey",
        defaults: { honey: 0.5, banana: 0.25, stardust: 0.1 },
        threshold: 0.85
      }
    ],
    suffix: "at the turn of the frost moon.",
    corpora: [TOKEN_FEAST_CORPUS, TOKEN_HISTORY, TOKEN_FRUIT],
    sampling: false,
    guide: {
      goal: "Fill both blanks in order to finish the sentence.",
      steps: [
        "Feed a book pack to fill the first blank.",
        "A second blank appears — its guesses depend on your first word.",
        "Fill the second blank to complete the sentence."
      ],
      learning: "AI writes one word at a time, and each word builds on the words before it (this is called autoregressive writing)."
    }
  },
  {
    title: "The slot machine",
    difficulty: "hard",
    intro:
      "Pull the lever! The bird picks a word at random — higher-chance words show up more (sampling). Even 90% isn't a sure thing. Pull a few times — that's why a chatbot never answers the same way twice.",
    chain: [
      {
        prefix: "The observatory reports a strange",
        correct: "comet",
        defaults: { comet: 0.55, spaceship: 0.25, banana: 0.1 },
        threshold: 0.8
      }
    ],
    suffix: "crossing the night sky above the west spire.",
    corpora: [TOKEN_ASTRONOMY_CORPUS, TOKEN_SCI_FI, TOKEN_FRUIT],
    sampling: true,
    guide: {
      goal: "Get the right word's chance high, then pull the lever to land it.",
      steps: [
        "Feed the best book pack to raise the correct word's chance.",
        "Pull the lever — the bird picks a word at random.",
        "Pull a few times and watch the results change."
      ],
      learning: "AI picks words a bit randomly, so the same question can get different answers (this is called sampling)."
    }
  },
  {
    title: "The impossible word",
    difficulty: "hardest",
    intro:
      "This time, NONE of the book packs have the right answer. First, type what YOU think it is. Then run it — and watch what the bird does when it doesn't actually know.",
    chain: [
      {
        prefix: "The headmaster's secret middle name is",
        correct: "Bartholomew",
        defaults: { Zephyr: 0.32, Banana: 0.28, Comet: 0.22 },
        threshold: 0.9
      }
    ],
    suffix: ", though few dare to say it aloud.",
    corpora: [TOKEN_ASTRONOMY_CORPUS, TOKEN_FEAST_CORPUS, TOKEN_FRUIT],
    sampling: false,
    hallucination: { correctAnswer: "Bartholomew", forcedTop: "Zephyr" },
    guide: {
      goal: "See what the bird does when the answer isn't in its books.",
      steps: [
        "Type what YOU think the answer is.",
        "Feed any book pack (none of them have the answer).",
        "Run it and watch the bird answer anyway."
      ],
      learning: "When AI doesn't have the answer, it still gives one — and sounds sure, even when it's wrong (this is called a hallucination)."
    }
  }
];
