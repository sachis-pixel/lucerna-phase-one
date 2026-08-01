"use client";

import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useGame } from "../GameShell";
import { WorkLogPopup, DropSocket, Gauge, GuideCard, Modal, Pipp, PoePanel, RoundHeader, RunButton, TokenCard } from "../ui";
import { calculateFinalOdds } from "@/engine/odds";
import { initialPoeState, isRunDisabled, poeReducer } from "@/engine/poe";
import { STAGE1_ROUNDS, type Stage1Round } from "@/data/rounds";
import { STAGE1_FACTS } from "@/data/facts";

/**
 * Stage 1 — Twin Wards, multi-round (Plans A+B+C+D)
 *  R1 easy: single feature, fuse badge+cloak (rules vs data)
 *  R2 medium: hidden weights → probe the black box; 2 rule checks
 *  R3 hard: two features (face+gait) with trade-off items
 *  End: ethics debate — did you change the model, or just fool it once?
 */

const SCENE = "scene_guard_01";

export default function Stage1() {
  const { setTheme, completeStage } = useGame();
  useEffect(() => setTheme("adversarial-red"), [setTheme]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [debate, setDebate] = useState(false);
  const round = STAGE1_ROUNDS[roundIdx];

  function onRoundClear() {
    if (roundIdx < STAGE1_ROUNDS.length - 1) {
      setRoundIdx((i) => i + 1);
    } else {
      setDebate(true);
    }
  }

  return (
    <div className="space-y-4">
      <RoundHeader index={roundIdx} total={STAGE1_ROUNDS.length} title={round.title} difficulty={round.difficulty} />
      <Stage1RoundView key={roundIdx} round={round} onClear={onRoundClear} isLastRound={roundIdx === STAGE1_ROUNDS.length - 1} />

      {debate && (
        <WorkLogPopup
          title="⚖️ Did you break the AI — or just trick it?"
          question={
            <>
              You got past the guard. Can it <b>never</b> recognise students again — or did your disguise just trick
              it <b>once</b>?
            </>
          }
          wrongLabel="It's broken now — it can't recognise anyone."
          rightLabel="It still works — I only tricked it once, for me."
          lesson="Right! You tricked it once. The AI didn't change — take off the cloak and it knows you again. (This trick is called an **evasion attack**.)"
          lessonNote="Remember this — in the Arena (last hall), you'll do the opposite: break an AI for **everyone**, forever."
          fact={STAGE1_FACTS[0]}
          onResolved={() => completeStage(1)}
        />
      )}
    </div>
  );
}

/* ————— one round ————— */

/** DEMO: playful "next" button used between staged-reveal chunks. */
function ContinueButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-brass mt-3 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black uppercase tracking-wider text-ink hover:brightness-110"
    >
      {label}
      <span className="animate-floaty">👉</span>
    </button>
  );
}

function Stage1RoundView({ round, onClear, isLastRound }: { round: Stage1Round; onClear: () => void; isLastRound: boolean }) {
  const [slotA, setSlotA] = useState<string | null>(null);
  const [slotB, setSlotB] = useState<string | null>(null);
  const [equipped, setEquipped] = useState<string[]>([]); // items worn this round
  const [armed, setArmed] = useState<string | null>(null);
  const [poe, dispatchPoe] = useReducer(poeReducer, initialPoeState);
  const [phase, setPhase] = useState<"setup" | "walking" | "blocked" | "passed">("setup");
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [probed, setProbed] = useState<Record<string, boolean>>({}); // blind-box: which items revealed
  const [fizzle, setFizzle] = useState<string | null>(null);

  // DEMO: staged reveal so a first-time reader sees one chunk at a time.
  // 0 = intro only → 1 = + goal card → 2 = + guards → 3 = full round (stays this way for actual play).
  const [revealStep, setRevealStep] = useState(0);

  const usesFusion = round.backpack.some((t) => t.id === "token_barcode") && round.backpack.some((t) => t.id === "token_cloak") && round.features.length === 1 && !round.hideWeights;

  const equippedTokens = useMemo(
    () => equipped.map((id) => round.backpack.find((t) => t.id === id)).filter(Boolean) as typeof round.backpack,
    [equipped, round.backpack]
  );

  // Build a default-probability map from the round's feature bases
  const defaults = useMemo(() => {
    const d: Record<string, number> = {};
    round.features.forEach((f) => (d[f.key] = f.base));
    round.ruleChecks.forEach((r) => (d[r.key] = 0));
    return d;
  }, [round]);

  const odds = useMemo(
    () => calculateFinalOdds(defaults, equippedTokens, SCENE),
    [defaults, equippedTokens]
  );

  const rulesPass = round.ruleChecks.every((r) => (odds[r.key] ?? 0) >= 1);
  const featuresPass = round.features.every((f) => (odds[f.key] ?? 0) <= round.featureThreshold);

  function toggleEquip(id: string) {
    setEquipped((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));
    setProbed((p) => ({ ...p, [id]: true }));
    dispatchPoe({ type: "SOCKET_CHANGED" });
    setPhase("setup");
  }

  function fuse() {
    dispatchPoe({ type: "RUN_CONSUMED" });
    setFizzle(null);
    const correct =
      (slotA === "token_barcode" && slotB === "token_cloak") ||
      (slotA === "token_cloak" && slotB === "token_barcode");
    if (correct) {
      // Fusion result = both underlying items active (barcode satisfies rule, cloak drags the bar)
      setEquipped(["token_barcode", "token_cloak"]);
      setSlotA(null);
      setSlotB(null);
    } else {
      const a = round.backpack.find((t) => t.id === slotA)?.name;
      const b = round.backpack.find((t) => t.id === slotB)?.name;
      setFizzle(`${a} + ${b}`);
      setSlotA(null);
      setSlotB(null);
    }
  }

  function walk() {
    dispatchPoe({ type: "RUN_CONSUMED" });
    setPhase("walking");
    setTimeout(() => {
      if (!rulesPass) {
        const missing = round.ruleChecks.find((r) => (odds[r.key] ?? 0) < 1);
        setBlockedReason(`The stone guard's rule said NO: it needs \"${missing?.label ?? "the rule"}\" and you don't have it. Rules are strict — you either match or you don't.`);
        setPhase("blocked");
      } else if (!featuresPass) {
        const over = round.features.find((f) => (odds[f.key] ?? 0) > round.featureThreshold);
        setBlockedReason(`The AI's ${over?.label} is still ${Math.round((odds[over?.key ?? ""] ?? 0) * 100)}% — that's above the ${Math.round(round.featureThreshold * 100)}% line. You need to bring it DOWN with better items.`);
        setPhase("blocked");
      } else {
        setPhase("passed");
      }
    }, 650);
  }

  const canFuse = slotA !== null && slotB !== null;
  const anythingEquipped = equipped.length > 0;

  return (
    <div className="space-y-4">
      <div className="animate-revealIn">
        <Pipp>{round.intro}</Pipp>
        {revealStep === 0 && <ContinueButton label="Okay, what's my goal? 🎯" onClick={() => setRevealStep(1)} />}
      </div>

      {revealStep >= 1 && (
        <div className="animate-revealIn">
          <GuideCard goal={round.guide.goal} steps={round.guide.steps} learning={round.guide.learning} />
          {revealStep === 1 && <ContinueButton label="Got it — meet the guards 🗿🔮" onClick={() => setRevealStep(2)} />}
        </div>
      )}

      {revealStep >= 2 && (
        <div className="animate-revealIn space-y-4">
          {/* Guards + the gate they're blocking */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="themed rounded-xl border border-tan bg-sand p-3">
              <div className="animate-popIn h-24 w-24 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/stone-gargoyle.webp" alt="Stone Gargoyle" className="h-full w-full object-cover" />
              </div>
              <div className="mt-1 text-xs font-black uppercase tracking-wider text-ink">Stone Gargoyle · Rule Engine</div>
              <div className="mt-2 space-y-1">
                {round.ruleChecks.map((r) => (
                  <div key={r.key} className={`text-sm font-bold ${(odds[r.key] ?? 0) >= 1 ? "text-guardian" : "text-alert"}`}>
                    {(odds[r.key] ?? 0) >= 1 ? "✓" : "✗"} {r.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="themed rounded-xl border border-tan bg-sand p-3">
              <div className="animate-popIn h-24 w-24 overflow-hidden rounded-lg border border-tan">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ai-guard.webp" alt="AI Crystal Beast" className="h-full w-full object-cover object-[68%_18%]" />
              </div>
              <div className="mt-1 text-xs font-black uppercase tracking-wider text-ink">AI Crystal Beast · Vision Model</div>
              <div className="mt-2 space-y-2">
                {round.features.map((f) => (
                  <Gauge key={f.key} label={f.label} value={odds[f.key] ?? 0} mode="blood" threshold={round.featureThreshold} />
                ))}
              </div>
            </div>
            <div className="themed flex flex-col items-center justify-center rounded-xl border-2 accent-border accent-soft-bg p-3 text-center">
              <div className="animate-popIn h-24 w-24 overflow-hidden rounded-lg border border-tan">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/gate.webp" alt="The Gate" className="h-full w-full object-cover object-[61%_45%]" />
              </div>
              <div className="mt-1 text-xs font-black uppercase tracking-wider accent-text">The Gate</div>
              <div className="mt-1 text-sm text-umber">Beat both guards, then walk through</div>
            </div>
          </div>
          {revealStep === 2 && <ContinueButton label="Let's play! 🎮" onClick={() => setRevealStep(3)} />}
        </div>
      )}

      {revealStep >= 3 && (
      <div className="animate-revealIn space-y-4">
      {/* Fusion circle (only when the round is the classic badge+cloak round) */}
      {usesFusion && equipped.length === 0 && (
        <div className="themed rounded-xl border border-tan bg-sand p-4">
          <div className="mb-2 text-xs font-black uppercase tracking-wider accent-text">⚗️ Local Alchemy Circle</div>
          <div className="flex flex-wrap items-center gap-3">
            <DropSocket label="Item A" tokenId={slotA} tokens={round.backpack} onDropToken={(id) => { setSlotA(id); dispatchPoe({ type: "SOCKET_CHANGED" }); }} onEmptyClick={() => { if (armed) { setSlotA(armed); setArmed(null); dispatchPoe({ type: "SOCKET_CHANGED" }); } }} onEject={() => { setSlotA(null); dispatchPoe({ type: "SOCKET_CHANGED" }); }} />
            <span className="text-2xl">＋</span>
            <DropSocket label="Item B" tokenId={slotB} tokens={round.backpack} onDropToken={(id) => { setSlotB(id); dispatchPoe({ type: "SOCKET_CHANGED" }); }} onEmptyClick={() => { if (armed) { setSlotB(armed); setArmed(null); dispatchPoe({ type: "SOCKET_CHANGED" }); } }} onEject={() => { setSlotB(null); dispatchPoe({ type: "SOCKET_CHANGED" }); }} />
          </div>
          <div className="mt-3 space-y-3">
            <PoePanel
              visible={canFuse}
              question='Prophecy: after fusing these, will the AI&apos;s "student" confidence go Higher or Lower?'
              prediction={poe.prediction}
              onPredict={(p) => dispatchPoe({ type: "PREDICTION_MADE", prediction: p })}
            />
            <RunButton disabled={isRunDisabled(poe, !canFuse)} onClick={fuse}>🔥 Fuse</RunButton>
          </div>
          {fizzle && (
            <div className="mt-3">
              <Pipp tone="warning">
                <b>Fzzzt!</b> {fizzle} don&apos;t work together. You need one item that beats the stone guard&apos;s rule
                AND one that lowers the AI&apos;s bar. Pick <b>one of each</b>.
              </Pipp>
            </div>
          )}
        </div>
      )}

      {/* Backpack (equip toggles) */}
      <div>
        <div className="mb-2 text-xs font-black uppercase tracking-wider text-umber/70">
          🎒 Backpack — {round.hideWeights ? "effects hidden! equip to probe" : "click to equip / unequip"}
        </div>
        <div className="flex flex-wrap gap-2">
          {round.backpack.map((t) => (
            <div key={t.id} className="flex flex-col items-center">
              <TokenCard token={t} selected={equipped.includes(t.id) || armed === t.id} onSelect={usesFusion && equipped.length === 0 ? (id) => setArmed((a) => (a === id ? null : id)) : toggleEquip} />
              {round.hideWeights && (
                <div className="mt-1 text-sm text-umber/60">{probed[t.id] ? "revealed" : "❓ unknown"}</div>
              )}
            </div>
          ))}
        </div>
        {usesFusion && armed && equipped.length === 0 && (
          <div className="mt-2 text-sm text-umber/70">Picked up {round.backpack.find((t) => t.id === armed)?.name} — click Item A or Item B.</div>
        )}
      </div>

      {/* Walk */}
      {phase !== "passed" && (!usesFusion || anythingEquipped) && (
        <>
          <PoePanel
            visible={anythingEquipped}
            question="Prophecy: walking to the gate now, will the AI's score for you go Higher or Lower?"
            prediction={poe.prediction}
            onPredict={(p) => dispatchPoe({ type: "PREDICTION_MADE", prediction: p })}
          />
          <RunButton disabled={isRunDisabled(poe, !anythingEquipped)} onClick={walk}>🚶 Walk through the gate</RunButton>
        </>
      )}

      {phase === "blocked" && blockedReason && <Pipp tone="warning">{blockedReason}</Pipp>}

      {phase === "passed" && (
        <Modal>
          {isLastRound ? (
            <video
              src="/stage1-gate-open.mp4"
              autoPlay
              muted
              playsInline
              className="animate-revealIn w-full rounded-lg border border-tan"
            />
          ) : (
            <div className="text-4xl">🎉</div>
          )}
          <h2 className="mt-2 font-display text-xl font-black uppercase tracking-wide accent-text">Round cleared!</h2>
          <p className="mt-2 text-sm leading-relaxed text-umber">
            You beat both guards! The rule matched, and every AI bar dropped under the line.
            {round.hideWeights && " You also figured out the hidden items just by testing them — that's how people study an AI they can't see inside."}
          </p>
          <button type="button" onClick={onClear} className="bg-brass mt-4 rounded-full px-6 py-2.5 font-black uppercase tracking-wider text-ink hover:brightness-110">
            Continue →
          </button>
        </Modal>
      )}
      </div>
      )}
    </div>
  );
}
