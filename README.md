# Lucerna Academy — Power One: The Chaos Forge

Playable implementation of the Power One Master Spec (PRD / Architecture / QA). Four stages teaching rules-vs-data, adversarial features, LLM next-token prediction, and data poisoning to grade 7–8 students. English UI, zero-login, offline-first.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 31 tests: engine, rounds, winnability guard, rendered-UI QA, e2e flows
npm run build    # production build
```

## Architecture — built for framework swaps

Game logic never touches React or Next.js:

```
src/engine/    Pure TypeScript, zero framework imports — survives any rewrite
  types.ts       UnifiedTokenAsset schema (§2.1), scene/POE/game types
  odds.ts        calculateFinalOdds: clamp(P_default + Σ ΔW, 0, 1) (§2.2)
  poe.ts         POE Prophecy Lock state machine (§2.3)
  adapter.ts     snake_case content-pack JSON → canonical camelCase; legacy scene-id aliases
  ghostdb.ts     GhostDb interface + LocalGhostDb mock (§2.7)
src/data/      Content only: token dictionary, scene seeds (§3.1), 12 bulletin templates
src/components/  React/Next UI layer — the only part you'd rewrite for another framework
```

To move to real multiplayer later: implement `GhostDb` against Next.js API routes (GET `/api/wanted`, POST `/api/breach`) and swap the instance in `Stage4.tsx`. Nothing else changes.

To ship real art: replace emoji strings in `src/data/tokens.ts` `skinAssets` with image paths; `TokenCard`/`DropSocket` accept either.

External content packs (snake_case JSON, like `token_sci_fi_003`) load through `adaptRawToken` — see `TOKEN_SCI_FI` in `tokens.ts` for the working example.

## Text pass — plain language for grade 7-8

All player-facing text rewritten for ~grade 5-6 reading level (buffer below the
7-8 target). Fantasy skin kept; only wording simplified. Real AI terms still
appear, but always after a plain-language explanation in parentheses — e.g.
"it guesses the next word that is most likely (this is called next-word
prediction)" — so students learn the real vocabulary without being blocked by it.

Every round now shows an always-visible **navigation card** with three panels:
🎯 Your goal (one line) · 🕹️ What to do (numbered steps) · 💡 You are learning
(one line). Content lives in each round's  field in src/data/rounds.ts.

## Round-3 build — all four stages expanded to multi-round (easy → hard)

Each stage went from a ~5-second single interaction to a multi-round ladder that
ramps in difficulty and ends with a reflection. Engine layer untouched; all new
logic is data (`src/data/rounds.ts`, `facts.ts`) + per-stage round views.

**Stage 1 — Twin Wards (3 rounds + ethics debate)**
1. Easy: fuse badge+cloak (rules vs data). 2. Medium: hidden item effects — probe
the black box; two rule checks. 3. Hard: two features (face+gait) with trade-off
items (a mask helps the face but hurts the gait). Ends: "did you break the model,
or trick it once?" — sets up the evasion-vs-poisoning contrast paid off in Stage 4.

**Stage 2 — Mutation Lab (3 rounds + ethics debate + real cases)**
1. Open books. 2. Blind box: weights hidden, infer them by experiment.
3. Budget & decoys: 2 slots, 5 stickers incl. a zero-effect decoy → feature
importance. Ends: "is the potion actually safe now?" + two real adversarial cases.

**Stage 3 — Forge (5 rounds, easy → hardest)**
1. Warm-up single word. 2–3. Chain completion: autoregressive, later words'
odds depend on earlier picks. 4. Slot machine: real weighted sampling — same odds,
different results (why chatbots vary). 5. Hallucination: no corpus contains the
answer; student types their own guess first, then watches the bird output a
confident wrong word → the Truth-vs-Odds debate lands harder.

**Stage 4 — Arena (4 rounds + differentiation from Stage 1)**
1. Undefended. 2. One Guardian Seal. 3. Heavy defense (may be un-breachable —
enough clean data resists poison). 4. Role flip: defend your own bird against
three junk waves. Breaches now leave permanent scars (bird stays poisoned for
everyone); a contrast card nails evasion-vs-poisoning. Entry screen shows an
arena preview so it no longer looks finished.

### New tests
- `winnability.test.ts` — brute-forces every round to prove a clearing combo
  exists (already caught one unwinnable Stage 3 chain slot during the build).
- `rounds.test.ts` — seeded sampler determinism + weight fidelity, difficulty
  ramp assertions, hallucination-round has-no-answer-in-data check.

## Round-2 improvements (develop -> test -> change -> improve)

- **Click-to-place everywhere**: every token can be clicked to pick up, then a slot clicked to place — full touch/tablet support alongside drag-and-drop (classroom iPads).
- **Component + e2e tests**: QA-01/03/04/05 now asserted against the *rendered UI* (button disabled states, hard-reset modal + card ejection + life loss, body-class theme flips, debate gating), plus full Stage 1 and Stage 4 playthrough tests.
- **A11y**: visible focus rings on all controls; empty sockets are real buttons; reduced-motion respected.
- **Reset progress** button in the header (clears save + Ghost DB — handy for teachers between class periods).
- Stage 1 UX: only one Prophecy Lock panel visible at a time (fusion panel owns the lock while the circle is loaded).

## Spec decisions locked in

- **Stage 3 three-path design**: history corpus → motto ≥ 90% → pass (gated by the §2.6 debate); sci-fi corpus → bird says "SPACESHIP" (valid run, seeds the debate question); fruit corpus → §2.5 Hard Reset (alarm, −1 life, card ejected, no soft pass). This reconciles §2.5/§2.6 with §3.1: only the fruit pack sets `isPoisonTriggered`.
- **Canonical scene IDs** from §3.1 (`scene_guard_01`, `scene_lab_02`, `scene_forge_03`, `scene_arena_04`); legacy `scene_forge_bird_01` auto-aliased in the adapter.
- **Stage 2 boundary**: pass at danger ≤ 25% (per §3.1 seed math), threshold line drawn on the gauge.
- **Lives**: 3 alchemy hearts, persist across stages; at 0 → restart current stage with full hearts.
- **POE lock**: enforced in all four stages, including fusion and arena attacks.
- **Stage 1 fusion**: produces a real composite asset (`token_geek_cloak`) whose modifier stack equals badge + cloak.
- **Stage 4**: red-mode for the active player; defense is the passive mirror (nickname + token array only — COPPA-safe, no PII). Ghost DB is a LocalStorage mock behind an interface.

## QA matrix → where it's verified

| QA ID | Where | How |
|---|---|---|
| QA-01-POE | `tests/engine.test.ts` + every stage's `RunButton` | `isRunDisabled` is the single source of `button.disabled`; locked until `PREDICTION_MADE`, re-locked on every socket change and after every run |
| QA-02-ADD | `tests/engine.test.ts` | 4 × (−30%) stickers: 5% after three, hard 0 after four; upper clamp at 1 also tested |
| QA-03-RESET | `Stage3.tsx` + test | Fruit corpus → banana shriek modal, red alarm, `loseLife()`, slot force-ejected to `null`, POE reset — no soft pass |
| QA-04-THEME | `globals.css` + `GameShell.setTheme` | Single `<body>` class flip (`theme-red`/`theme-blue`); all themed properties transition in 200ms via CSS vars |
| QA-05-DEBATE | `Stage3.tsx` | Gate stays shut on success; unskippable two-option debate; option 1 → bird's bar-chart formula panel → second confirm required before unlock |

## Manual playtest script (5 min)

1. **Stage 1**: click the apple → predict → walk → blocked by the beast. Drag badge + cloak into the circle → predict → fuse → walk → banana misclassification, pass.
2. **Stage 2**: drop Holy Light + Mist on any two slots → predict Lower → scan → 25%, pass. (Try the Skull Doodle first to watch danger go *up*.)
3. **Stage 3**: theme flips to blue. Feed the sci-fi corpus → "SPACESHIP". Feed the fruit corpus → explosion, lose a heart, card ejected. Feed history → 95% → debate popup → pick option 1 → formula panel → confirm → gate opens.
4. **Stage 4**: pick an alias → wanted board loads 3 mirrors → target Captain Crumb (weak) → drop Spam + Fruit → predict → breach. Sir Bytealot / Nocturne have Guardian Seals and hold at one junk pack. Three breaches → medal.
