# Design Backlog — Approved, Not Yet Built

## Stage 2 expansion: "5-second game → 5-minute game" (Plan A + B + C)

Status: APPROVED by client 2026-07-18. Build after stages 3 & 4 review feedback, all together.

### A. Three-round progression (replaces single-bottle round)
1. **Round 1 — Open books** (current behavior): all sticker weights visible.
   Teaches: confidence = additive feature weights.
2. **Round 2 — Blind box**: sticker weights HIDDEN. Student must experiment:
   place sticker → observe danger delta → infer that sticker's weight.
   Teaches: probing a black-box model (real-world adversarial recon).
   Impl: new flag `weightsHidden` per round; scanner panel shows "?" for modifiers
   until each sticker has been run at least once, then reveals the inferred value.
3. **Round 3 — Budget mode**: only 2 sticker slots usable, but 5 sticker options
   (strong / weak / zero-effect decoys). Student must rank feature importance.
   Impl: new tokens with varied weights incl. a 0% decoy; slot count limited.

### B. Post-clear ethics popup — "Fooling the scanner ≠ changing reality"
After Round 3 clear, unskippable two-choice popup (mirrors Stage 3 debate §2.6):
"Danger reads 25% — is the potion actually SAFE now?"
- "Yes, safe now" → Pipp corrects: the potion never changed, only the math did.
- "No — only the scanner's math changed" → praised.
Gate to Stage 3 blocked until answered.

### C. Real-world connection card
In the final clear modal, show 1–2 real cases (text + emoji, no external images):
- Stickers on a stop sign made a self-driving model read "Speed Limit 45".
- Patterned glasses defeating face recognition.
Framing: "what you just did is a real security problem called an adversarial attack."

### Scope notes
- Engine untouched: rounds are data + Stage2 component state only.
- Add tests: round progression, blind-box reveal logic, ethics gate blocking.
- Est. ~half day.

## Stage 3 expansion: easy→hard next-token ladder (Plan A + B + C)

Status: APPROVED by client 2026-07-18, with difficulty-ramp requirement.
Build together with Stage 2 expansion after Stage 4 review.

### Difficulty ramp (client requirement: easy at first, harder each round)
1. **Round 1 — Warm-up (easy)**: current single-slot round, obvious answer,
   correct corpus clearly labeled. Everyone succeeds fast. Teaches the basic
   feed→odds→speak loop.
2. **Rounds 2–3 — Chain completion (medium)**: autoregressive chain across a
   longer bulletin: fill word 1 → sentence continues → word 2 slot appears →
   word 3. Each slot has its own odds panel; later slots' default odds depend
   on earlier chosen words (Plan A). Corpus choices less obvious; decoy corpora
   with partial overlap.
3. **Round 4 — Slot machine (medium-hard, Plan B)**: spec's "slot machine"
   sampling. Wheel animation sized by probability; pulling the lever actually
   samples. Even at school 95%, spaceship occasionally comes up → teaches
   randomness/temperature, "why does ChatGPT answer differently each time".
4. **Round 5 — Hallucination (hard, Plan C + client addition)**: NONE of the
   available corpora contain the correct word. Before running, the student
   must TYPE what they believe the correct word is (free text input). Then the
   bird speaks its argmax — a confidently wrong low-probability word (e.g. 32%).
   Reveal panel contrasts: "You knew the answer wasn't in the data. The bird
   cannot know that — it must always output its highest-probability word, even
   when the highest is garbage. It will never say 'I don't know'. That is a
   hallucination." Then flows into the existing Truth-vs-Odds debate (§2.6),
   which now lands harder.

### Impl notes
- Engine untouched: chain = calculateFinalOdds called per word-position with
  position-dependent default matrices; sampling = weighted random over odds.
- Typed answer: no grading needed (any non-empty input accepted); it exists to
  force the student to hold a "ground truth" in mind before seeing the bird's.
- Reuse BULLETIN_TEMPLATES for chain sentences.
- Tests: ramp progression, chain dependency of odds, sampling distribution
  sanity (seeded RNG), hallucination round requires typed input before run,
  debate still gates the door.

## Stage 4 expansion: easy→hard poisoning ladder + differentiation from Stage 1
Status: APPROVED by client 2026-07-18. Build with Stage 2 & 3 expansions.

### Core problem to fix
Mechanically Stage 4 currently feels identical to Stage 1 (drag cards, push a
number past a line). The conceptual difference (evasion vs. data poisoning;
one-time trick vs. permanent model damage; attack + defense + system view)
lives only in flavor text. Make the difference felt in the hands.

### Differentiation (make poisoning ≠ evasion tangible)
1. **Permanent scars**: breaching a bird permanently lowers its baseline; the
   wanted board shows "poisoned ×N — now says banana to everyone". A poisoned
   bird stays poisoned across the session. Contrast card after a breach:
   "Stage 1 you fooled a camera once; here you taught MothQueen's bird to be
   wrong forever — which is worse, and why?"
2. **Forced defense round**: player must first equip their OWN bird with defense
   corpora, then WATCH a replay of 3 classmates' junk traffic hitting it,
   hold/breached announced live. Experiencing both sides teaches the asymmetry
   (poisoning is easy, cleaning is hard).

### Difficulty ramp (easy → hard)
1. **Round 1 — Undefended (easy)**: target a bird with no Guardian Seal
   (Captain Crumb style). One junk pack breaches it. Everyone succeeds. Teaches
   the basic poison→baseline-drop loop.
2. **Round 2 — Single seal (medium)**: target has 1 defense corpus. One junk
   pack isn't enough; need to stack 2, or pick the junk whose weights best
   counter that specific seal. Teaches clean-data-vs-dirty-data tug of war.
3. **Round 3 — Heavy defense (hard)**: target has 2+ clean corpora
   (Sir Bytealot / Nocturne). Even 2 junk slots full can't breach with generic
   junk — student must READ the defense stack and choose junk that targets the
   specific weakness, or accept it's un-breachable (teaches: enough clean data
   makes a model poison-resistant — why big models are hard to poison).
4. **Round 4 — Defense mode (hardest, flips the role)**: student now DEFENDS.
   Configure own bird's clean-data budget against an incoming wave; more/cleaner
   data wins. Closes the loop: they've now attacked AND defended, felt the
   asymmetry firsthand.

### Impl notes
- Engine untouched: scars = persisted baseline delta in the ghost mirror;
  defense replay = calculateFinalOdds run per incoming attacker.
- Entry page currently looks empty/finished (client + student confusion): add
  an arena preview (wanted-board teaser + "enter an alias, 3 rival birds await")
  so it doesn't read as game-over.
- Tests: ramp gating, permanent-scar persistence, defense-round hold/breach math,
  entry-page preview renders.

## Parked (next iteration, not approved yet)
- Stage 3 D: dual-slot corpus blending (70/30 ratio mixing).
- Stage 3 E: detox round (pre-poisoned slot, diagnose → remove → refeed).
- D. Feature highlight on hover (bottle region glows + shows contribution %).
- E. Exact-number prophecy (guess the resulting % within ±5) for rounds 2–3.
- Stage 1 first-run prophecy tutorial (Pipp walks through the first prediction)
  — pending student playtest evidence.
