"use client";

import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useGame } from "../GameShell";
import { DebatePopup, DropSocket, FactCard, Gauge, GuideCard, Modal, Pipp, PoePanel, RoundHeader, RunButton, TokenCard } from "../ui";
import { calculateFinalOdds, isScenePassed } from "@/engine/odds";
import { initialPoeState, isRunDisabled, poeReducer } from "@/engine/poe";
import { STAGE2_ROUNDS, type Stage2Round } from "@/data/rounds";
import { STAGE2_FACTS } from "@/data/facts";

/**
 * Stage 2 — Mutation Lab, multi-round (Plans A+B+C)
 *  R1 open books · R2 blind box (hidden weights) · R3 budget & decoys
 *  End: ethics debate (fooling the scanner ≠ making the potion safe) + real-world card
 */

const SCENE = "scene_lab_02";
const FEATURE_LABELS = [
  { emoji: "💀", label: "Cap: skull mark" },
  { emoji: "🧪", label: "Body: glass texture" },
  { emoji: "🔦", label: "Background: harsh glare" }
];
/** One potion image per round, in order. */
const POTION_IMAGES = ["/potion-1.webp", "/potion-2.webp", "/potion-3.webp"];

export default function Stage2() {
  const { setTheme, completeStage } = useGame();
  useEffect(() => setTheme("adversarial-red"), [setTheme]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [debate, setDebate] = useState(false);
  const round = STAGE2_ROUNDS[roundIdx];

  function onClear() {
    if (roundIdx < STAGE2_ROUNDS.length - 1) setRoundIdx((i) => i + 1);
    else setDebate(true);
  }

  return (
    <div className="space-y-4">
      <RoundHeader index={roundIdx} total={STAGE2_ROUNDS.length} title={round.title} difficulty={round.difficulty} />
      <Stage2RoundView key={roundIdx} round={round} onClear={onClear} roundIdx={roundIdx} />

      {debate && (
        <DebatePopup
          title="⚗️ Danger says 20% — is the potion safe now?"
          question={
            <>
              The scanner shows low danger now. Be honest — is the potion <b>really safe to drink</b>? Or did you just
              change the <b>score</b>?
            </>
          }
          wrongLabel="It's safe now — the danger score is low."
          rightLabel="Not safe — only the score changed, not the potion."
          correction={
            <>
              <p>
                Right. The potion&apos;s just as dangerous as before. You covered up the parts the AI looks at, so its
                score dropped. A score is <b>not</b> the truth — it&apos;s just added-up points.
              </p>
              <div className="mt-3 space-y-2">
                <FactCard {...STAGE2_FACTS[0]} />
                <FactCard {...STAGE2_FACTS[1]} />
              </div>
            </>
          }
          onResolved={() => completeStage(2)}
        />
      )}
    </div>
  );
}

function Stage2RoundView({ round, onClear, roundIdx }: { round: Stage2Round; onClear: () => void; roundIdx: number }) {
  const slots = FEATURE_LABELS.slice(0, round.slotCount);
  const [filled, setFilled] = useState<(string | null)[]>(Array(round.slotCount).fill(null));
  const [armed, setArmed] = useState<string | null>(null);
  const [poe, dispatchPoe] = useReducer(poeReducer, initialPoeState);
  const [scanned, setScanned] = useState(false);
  const [passed, setPassed] = useState(false);
  const [tested, setTested] = useState<Record<string, number>>({}); // blind-box inferred deltas

  const activeTokens = useMemo(
    () => filled.filter((id): id is string => !!id).map((id) => round.tray.find((t) => t.id === id)!).filter(Boolean),
    [filled, round.tray]
  );

  const odds = useMemo(() => calculateFinalOdds({ danger: round.base }, activeTokens, SCENE), [activeTokens, round.base]);
  const danger = odds.danger ?? 0;

  function setSlot(i: number, id: string | null) {
    setFilled((f) => {
      const next = [...f];
      if (id) next.forEach((v, j) => { if (v === id) next[j] = null; });
      next[i] = id;
      return next;
    });
    setScanned(false);
    dispatchPoe({ type: "SOCKET_CHANGED" });
  }

  function runScan() {
    dispatchPoe({ type: "RUN_CONSUMED" });
    setScanned(true);
    // blind-box: record each active sticker's contribution so we can reveal it
    if (round.hideWeights) {
      const rec: Record<string, number> = { ...tested };
      activeTokens.forEach((t) => {
        const m = t.weightModifiers.find((w) => w.targetSceneId === SCENE);
        rec[t.id] = m?.probabilities.danger ?? 0;
      });
      setTested(rec);
    }
    if (isScenePassed(odds, "danger", "below", round.threshold)) setTimeout(() => setPassed(true), 500);
  }

  const anyFilled = activeTokens.length > 0;

  return (
    <div className="space-y-4">
      <Pipp>{round.intro}</Pipp>
      <GuideCard goal={round.guide.goal} steps={round.guide.steps} learning={round.guide.learning} />

      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        <div className="themed rounded-xl border border-white/15 bg-black/30 p-4">
          <div className="mb-3 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={POTION_IMAGES[roundIdx]} alt="Potion" className="h-32 w-32 object-contain" />
          </div>
          <div className="space-y-2">
            {slots.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-48 text-sm text-white/60">{s.emoji} {s.label}</div>
                <DropSocket
                  label="rune slot"
                  tokenId={filled[i]}
                  tokens={round.tray}
                  onDropToken={(id) => setSlot(i, id)}
                  onEmptyClick={() => { if (armed) { setSlot(i, armed); setArmed(null); } }}
                  onEject={() => setSlot(i, null)}
                  wide
                />
              </div>
            ))}
          </div>
        </div>

        <div className="themed rounded-xl border accent-border bg-black/40 p-4">
          <div className="text-xs font-black uppercase tracking-wider accent-text">🧠 Brain Scanner</div>
          <div className="mt-3">
            <Gauge label='"DANGER" confidence' value={danger} mode="blood" threshold={round.threshold} />
          </div>
          <div className="mt-3 space-y-1 font-mono text-sm text-white/50">
            <div>base danger: {Math.round(round.base * 100)}%</div>
            {activeTokens.map((t) => {
              const m = t.weightModifiers.find((w) => w.targetSceneId === SCENE);
              const d = m?.probabilities.danger ?? 0;
              const show = !round.hideWeights || tested[t.id] !== undefined;
              return (
                <div key={t.id}>
                  {t.skinAssets.stickerView} {t.name}: {show ? `${d > 0 ? "+" : ""}${Math.round(d * 100)}%` : "❓ run to reveal"}
                </div>
              );
            })}
            <div className="border-t border-white/20 pt-1 font-black text-white">= {Math.round(danger * 100)}% (clamped 0–100)</div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-black uppercase tracking-wider text-white/50">
          🎒 Sticker tray {round.hideWeights ? "— effects hidden, experiment to learn them" : "— drag onto a slot, or click to pick up"}
        </div>
        <div className="flex flex-wrap gap-2">
          {round.tray.map((t) => (
            <TokenCard key={t.id} token={t} selected={armed === t.id} onSelect={(id) => setArmed((a) => (a === id ? null : id))} />
          ))}
        </div>
      </div>

      <PoePanel
        visible={anyFilled}
        question="Prophecy: after this change, will the danger score go Higher or Lower?"
        prediction={poe.prediction}
        onPredict={(p) => dispatchPoe({ type: "PREDICTION_MADE", prediction: p })}
      />
      <RunButton disabled={isRunDisabled(poe, !anyFilled)} onClick={runScan}>🔍 Run scan</RunButton>

      {scanned && !passed && danger > round.threshold && (
        <Pipp tone="warning">
          Still {Math.round(danger * 100)}% — above the {Math.round(round.threshold * 100)}% line.
          {round.hideWeights ? " Which sticker moved the number most? Lean on that one." : " Which feature still carries the biggest weight?"}
        </Pipp>
      )}

      {passed && (
        <Modal>
          <div className="text-4xl">🧪✨</div>
          <h2 className="mt-2 font-display text-xl font-black accent-text">Round cleared: {Math.round(danger * 100)}% danger</h2>
          <p className="mt-2 text-sm leading-relaxed">
            {round.hideWeights
              ? "You inferred the hidden weights by experiment — that's exactly how people probe a model they can't see inside."
              : round.slotCount === 2
                ? "With only two slots, you had to rank the features by importance and ignore the decoy. That's feature-importance thinking."
                : "You changed the features, not the potion — and the model's sum dropped."}
          </p>
          <button type="button" onClick={onClear} className="bg-brass mt-4 rounded-lg px-6 py-2.5 font-black uppercase tracking-wider text-ink hover:brightness-110">
            Continue →
          </button>
        </Modal>
      )}
    </div>
  );
}
