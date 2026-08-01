"use client";

import React from "react";
import { createPortal } from "react-dom";
import type { PoePrediction, UnifiedTokenAsset } from "@/engine/types";

/* ————— Drag helpers (HTML5 DnD + click-to-place fallback) ————— */

export const DRAG_MIME = "application/x-lucerna-token";

export function TokenCard({
  token,
  selected,
  onSelect,
  disabled
}: {
  token: UnifiedTokenAsset;
  selected?: boolean;
  onSelect?: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      draggable={!disabled}
      onDragStart={(e) => e.dataTransfer.setData(DRAG_MIME, token.id)}
      onClick={() => !disabled && onSelect?.(token.id)}
      title={token.description}
      className={`group w-36 shrink-0 cursor-grab rounded-xl border-2 bg-sand p-2 text-left transition
        ${selected ? "accent-border accent-glow" : "border-tan hover:border-brass"}
        ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <div className="text-3xl">{token.skinAssets.cardView}</div>
      <div className="mt-1 text-sm font-bold leading-tight text-ink">{token.name}</div>
      <div className="mt-0.5 text-sm uppercase tracking-wider text-umber/70">
        {token.type === "TEXT_CORPUS" ? "corpus" : "sticker"}
      </div>
    </button>
  );
}

export function DropSocket({
  label,
  tokenId,
  tokens,
  onDropToken,
  onEject,
  onEmptyClick,
  wide
}: {
  label: string;
  tokenId: string | null;
  tokens: UnifiedTokenAsset[];
  onDropToken: (id: string) => void;
  /** Click-to-place fallback for touch devices: called when the empty socket is clicked. */
  onEmptyClick?: () => void;
  onEject?: () => void;
  wide?: boolean;
}) {
  const token = tokens.find((t) => t.id === tokenId) ?? null;
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData(DRAG_MIME);
        if (id) onDropToken(id);
      }}
      className={`themed flex min-h-[72px] items-center justify-center rounded-lg border-2 border-dashed p-2 text-center
        ${token ? "accent-border accent-soft-bg" : "border-brass/50 bg-sand/60"}
        ${wide ? "min-w-[180px]" : "min-w-[110px]"}`}
    >
      {token ? (
        <button type="button" onClick={onEject} title="Click to remove" className="flex flex-col items-center">
          <span className="text-3xl">{token.skinAssets.stickerView}</span>
          <span className="text-sm text-ink">{token.name}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onEmptyClick}
          className="h-full w-full min-h-[56px] text-sm uppercase tracking-widest text-umber/60"
        >
          {label}
        </button>
      )}
    </div>
  );
}

/* ————— POE Pre-activation Lock panel (§2.3) ————— */

export function PoePanel({
  question,
  prediction,
  onPredict,
  visible,
  upLabel = "Higher ↑",
  downLabel = "Lower ↓"
}: {
  question: string;
  prediction: PoePrediction | null;
  onPredict: (p: PoePrediction) => void;
  visible: boolean;
  /** Override for questions that aren't phrased as "higher or lower" (e.g. yes/no). */
  upLabel?: string;
  downLabel?: string;
}) {
  if (!visible) return null;
  return (
    <div className="themed rounded-xl border accent-border accent-soft-bg p-3">
      <div className="text-xs font-bold text-ink">🔮 Prophecy Lock — {question}</div>
      <div className="mt-1 text-sm text-umber">
        Make a guess before you run — wrong guesses are fine! It just gets you thinking about what&apos;ll happen.
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onPredict("up")}
          className={`rounded-full border px-4 py-1.5 text-sm font-bold ${prediction === "up" ? "bg-brass text-ink border-brass" : "border-tan text-umber hover:border-brass"}`}
        >
          {upLabel}
        </button>
        <button
          type="button"
          onClick={() => onPredict("down")}
          className={`rounded-full border px-4 py-1.5 text-sm font-bold ${prediction === "down" ? "bg-brass text-ink border-brass" : "border-tan text-umber hover:border-brass"}`}
        >
          {downLabel}
        </button>
      </div>
      {prediction === null && (
        <div className="mt-2 text-sm text-umber/80">Make a prediction to unlock the run button.</div>
      )}
    </div>
  );
}

export function RunButton({
  disabled,
  onClick,
  children
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-testid="submit-button"
      className={`themed rounded-full px-6 py-2.5 text-sm font-black uppercase tracking-wider
        ${disabled ? "cursor-not-allowed bg-ink/10 text-ink/30" : "bg-brass text-ink accent-glow hover:brightness-110"}`}
    >
      {children}
    </button>
  );
}

/* ————— Scanner gauge: blood bar (red) / charge bar (blue) ————— */

export function Gauge({
  label,
  value,
  mode,
  threshold
}: {
  label: string;
  value: number; // 0..1
  mode: "blood" | "charge";
  threshold?: number;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm uppercase tracking-wider text-umber">
        <span>{label}</span>
        <span className="font-black text-ink">{pct}%</span>
      </div>
      <div className="relative mt-1 h-4 overflow-hidden rounded-full border border-tan bg-sandDeep">
        <div
          className="themed h-full accent-bg transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
        {threshold !== undefined && (
          <div
            className="absolute top-0 h-full w-0.5 bg-ink/60"
            style={{ left: `${threshold * 100}%` }}
            title={`Boundary: ${Math.round(threshold * 100)}%`}
          />
        )}
      </div>
      <div className="mt-0.5 text-sm text-umber/70">
        {mode === "blood" ? "Confidence health bar — stickers drain it" : "Charge bar — corpora fill it"}
        {threshold !== undefined && ` · boundary ${Math.round(threshold * 100)}%`}
      </div>
    </div>
  );
}

export function OddsBars({ odds, highlight }: { odds: Array<[string, number]>; highlight?: string }) {
  return (
    <div className="space-y-1.5">
      {odds.map(([name, p]) => (
        <div key={name} className="flex items-center gap-2 text-sm">
          <span className={`w-24 truncate ${name === highlight ? "font-black accent-text" : "text-umber"}`}>
            {name}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sandDeep">
            <div
              className={`h-full ${name === highlight ? "accent-bg" : "bg-ink/25"} transition-all duration-500`}
              style={{ width: `${p * 100}%` }}
            />
          </div>
          <span className="w-12 text-right font-mono text-ink">{Math.round(p * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

/* ————— Philosopher the ghost mentor ————— */

export function Pipp({ children, tone = "normal" }: { children: React.ReactNode; tone?: "normal" | "warning" | "happy" }) {
  return (
    <div className={`themed flex items-start gap-3 rounded-xl border p-3 ${tone === "warning" ? "border-alert bg-alert/10" : "border-tan bg-sand"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/philosopher.svg" alt="Philosopher" className="animate-floaty h-10 w-10 shrink-0 object-contain" />
      <div className="text-base leading-relaxed text-ink">
        <span className="font-black text-ink">Philosopher: </span>
        <span className="text-umber">{children}</span>
      </div>
    </div>
  );
}

export function Hearts({ lives, max = 3 }: { lives: number; max?: number }) {
  return (
    <div className="flex items-center gap-1 text-lg" title="Alchemy health">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < lives ? "" : "opacity-20 grayscale"}>
          ❤️‍🔥
        </span>
      ))}
    </div>
  );
}

export function Modal({ children, tone = "normal" }: { children: React.ReactNode; tone?: "normal" | "alarm" }) {
  // Portal straight to <body> — a fixed-position modal only truly anchors to the
  // browser window when NO ancestor has a transform. Any transformed ancestor
  // (e.g. an animate-revealIn wrapper elsewhere in the tree) would otherwise
  // silently turn "fixed" into "positioned relative to that ancestor instead".
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${tone === "alarm" ? "bg-alert/30" : "bg-hearth/70"}`}>
      <div className={`parchment-card animate-revealIn max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 p-5 ${tone === "alarm" ? "border-alert animate-shake" : "accent-border"}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ————— Multi-round shared UI ————— */

export function RoundHeader({
  index,
  total,
  title,
  difficulty
}: {
  index: number;
  total: number;
  title: string;
  difficulty: "easy" | "medium" | "hard" | "hardest";
}) {
  const dots = ["easy", "medium", "hard", "hardest"];
  const level = dots.indexOf(difficulty) + 1;
  return (
    <div className="themed flex items-center justify-between rounded-lg border border-tan bg-sand px-3 py-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-black accent-text">Round {index + 1}/{total}</span>
        <span className="text-umber/60">·</span>
        <span className="font-bold text-ink">{title}</span>
      </div>
      <div className="flex items-center gap-1" title={`Difficulty: ${difficulty}`}>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`text-sm ${i <= level ? "" : "opacity-25"}`}>🔥</span>
        ))}
      </div>
    </div>
  );
}

export function FactCard({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="themed rounded-xl border border-brass/40 bg-brass/10 p-3">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{emoji}</div>
        <div>
          <div className="text-xs font-black text-brass">{title}</div>
          <div className="mt-1 text-base leading-relaxed text-umber">{body}</div>
        </div>
      </div>
    </div>
  );
}

/** Reusable two-choice ethics/logic debate — gate stays shut until resolved. */
export function DebatePopup({
  title,
  question,
  wrongLabel,
  rightLabel,
  correction,
  onResolved
}: {
  title: string;
  question: React.ReactNode;
  wrongLabel: string;
  rightLabel: string;
  correction: React.ReactNode;
  onResolved: () => void;
}) {
  const [showCorrection, setShowCorrection] = React.useState(false);
  if (showCorrection) {
    return (
      <Modal>
        <h2 className="font-display text-xl font-black uppercase tracking-wide accent-text">{title}</h2>
        <div className="mt-3 flex gap-3 rounded-xl bg-sand p-4 text-base leading-relaxed text-umber">
          <div className="animate-popIn text-2xl">💡</div>
          <div>{correction}</div>
        </div>
        <button
          type="button"
          onClick={onResolved}
          className="bg-brass mt-4 rounded-full px-6 py-2.5 font-black uppercase tracking-wider text-ink hover:brightness-110"
        >
          I understand now
        </button>
      </Modal>
    );
  }
  return (
    <Modal>
      <h2 className="font-display text-xl font-black uppercase tracking-wide accent-text">{title}</h2>
      <div className="mt-3 text-base leading-relaxed text-umber">{question}</div>
      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowCorrection(true)}
          className="group flex w-full items-center gap-3 rounded-xl border-2 border-tan bg-sand p-3 text-left text-base text-ink transition hover:border-alert hover:bg-alert/10"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/10 text-sm font-black text-umber transition group-hover:bg-alert group-hover:text-white">
            A
          </span>
          {wrongLabel}
        </button>
        <button
          type="button"
          onClick={onResolved}
          className="group flex w-full items-center gap-3 rounded-xl border-2 border-tan bg-sand p-3 text-left text-base text-ink transition hover:border-guardian hover:bg-guardian/10"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/10 text-sm font-black text-umber transition group-hover:bg-guardian group-hover:text-white">
            B
          </span>
          {rightLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ————— Work Log debate variant (DEMO — Stage 1 only): wrong-answer lesson
   plays out as a Work Log entry — book pops in, flips open, then the lesson
   types in word by word so the reader can't skim past it. Picking the right
   answer skips straight to onResolved, same as the plain DebatePopup. ————— */

/** Tokenizes on whitespace first so punctuation stuck to a **bold** word (e.g. "attack**.)") stays glued to it. */
function parseEmphasisWords(text: string): { word: string; bold: boolean }[] {
  const out: { word: string; bold: boolean }[] = [];
  let boldActive = false;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    const markerCount = (raw.match(/\*\*/g) || []).length;
    const bold = markerCount > 0 ? boldActive || raw.startsWith("**") : boldActive;
    if (markerCount % 2 === 1) boldActive = !boldActive;
    out.push({ word: raw.replace(/\*\*/g, ""), bold });
  }
  return out;
}

function TypedWords({ words, shown }: { words: { word: string; bold: boolean }[]; shown: number }) {
  return (
    <>
      {words.slice(0, shown).map((w, i) => (
        <span key={i} className={w.bold ? "font-black text-brass" : undefined}>
          {w.word}{" "}
        </span>
      ))}
    </>
  );
}

export function WorkLogPopup({
  title,
  question,
  wrongLabel,
  rightLabel,
  lesson,
  lessonNote,
  fact,
  onResolved
}: {
  title: string;
  question: React.ReactNode;
  wrongLabel: string;
  rightLabel: string;
  /** Plain text — wrap key terms in **double asterisks** for emphasis. Typed word by word. */
  lesson: string;
  lessonNote?: string;
  fact?: { emoji: string; title: string; body: string };
  onResolved: () => void;
}) {
  const [pickedWrong, setPickedWrong] = React.useState(false);
  const [bookOpen, setBookOpen] = React.useState(false);
  const [shown, setShown] = React.useState(0);

  const lessonWords = React.useMemo(() => parseEmphasisWords(lesson), [lesson]);
  const noteWords = React.useMemo(() => (lessonNote ? parseEmphasisWords(lessonNote) : []), [lessonNote]);
  const totalWords = lessonWords.length + noteWords.length;
  const typingDone = shown >= totalWords;

  React.useEffect(() => {
    if (!pickedWrong) return;
    const t = setTimeout(() => setBookOpen(true), 650);
    return () => clearTimeout(t);
  }, [pickedWrong]);

  React.useEffect(() => {
    if (!bookOpen || typingDone) return;
    const t = setTimeout(() => setShown((s) => s + 1), 90);
    return () => clearTimeout(t);
  }, [bookOpen, shown, typingDone]);

  function skipTyping() {
    setBookOpen(true);
    setShown(totalWords);
  }

  if (!pickedWrong) {
    return (
      <Modal>
        <h2 className="font-display text-xl font-black uppercase tracking-wide accent-text">{title}</h2>
        <div className="mt-3 text-base leading-relaxed text-umber">{question}</div>
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => setPickedWrong(true)}
            className="group flex w-full items-center gap-3 rounded-xl border-2 border-tan bg-sand p-3 text-left text-base text-ink transition hover:border-alert hover:bg-alert/10"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/10 text-sm font-black text-umber transition group-hover:bg-alert group-hover:text-white">
              A
            </span>
            {wrongLabel}
          </button>
          <button
            type="button"
            onClick={onResolved}
            className="group flex w-full items-center gap-3 rounded-xl border-2 border-tan bg-sand p-3 text-left text-base text-ink transition hover:border-guardian hover:bg-guardian/10"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/10 text-sm font-black text-umber transition group-hover:bg-guardian group-hover:text-white">
              B
            </span>
            {rightLabel}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal>
      <div className="flex flex-col items-center text-center">
        <div className="text-sm font-black uppercase tracking-[0.2em] text-brass">📖 New Work Log Entry</div>
        <div className="relative mt-2 h-32 w-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/worklog-closed.webp"
            alt=""
            className={`absolute inset-0 h-full w-full object-contain transition-all duration-500 ${bookOpen ? "scale-x-0 opacity-0" : "animate-popIn scale-100 opacity-100"}`}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/worklog-open.webp"
            alt=""
            className={`absolute inset-0 h-full w-full object-contain transition-all duration-500 ${bookOpen ? "scale-100 opacity-100" : "scale-x-0 opacity-0"}`}
          />
        </div>
      </div>

      {bookOpen && (
        <div className="animate-revealIn mt-4">
          <div className="relative min-h-[88px] rounded-xl border border-brass/40 bg-brass/10 p-4 text-base leading-relaxed text-umber">
            <TypedWords words={lessonWords} shown={Math.min(shown, lessonWords.length)} />
            {noteWords.length > 0 && Math.min(shown, lessonWords.length) >= lessonWords.length && (
              <p className="mt-2">
                <TypedWords words={noteWords} shown={Math.max(0, shown - lessonWords.length)} />
              </p>
            )}
            {!typingDone && (
              <button
                type="button"
                onClick={skipTyping}
                className="absolute bottom-2 right-3 text-sm text-umber/60 underline hover:text-ink"
              >
                skip ⏭
              </button>
            )}
          </div>

          {typingDone && (
            <div className="animate-revealIn">
              {fact && (
                <div className="mt-3">
                  <FactCard emoji={fact.emoji} title={fact.title} body={fact.body} />
                </div>
              )}
              <button
                type="button"
                onClick={onResolved}
                className="bg-brass mt-4 w-full rounded-full px-6 py-2.5 font-black uppercase tracking-wider text-ink hover:brightness-110"
              >
                I understand now
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ————— Always-visible navigation card: Goal / What to do / Learning ————— */

export function GuideCard({
  goal,
  steps,
  learning
}: {
  goal: React.ReactNode;
  steps: React.ReactNode[];
  learning: React.ReactNode;
}) {
  return (
    <div className="themed grid gap-2 rounded-xl border border-tan bg-sand/60 p-3 sm:grid-cols-3">
      <div className="rounded-lg accent-soft-bg p-2">
        <div className="text-sm font-black uppercase tracking-wider accent-text">🎯 Your goal</div>
        <div className="mt-1 text-base leading-snug text-ink">{goal}</div>
      </div>
      <div className="rounded-lg bg-ink/5 p-2">
        <div className="text-sm font-black uppercase tracking-wider text-umber">🕹️ What to do</div>
        <ol className="mt-1 list-inside list-decimal space-y-0.5 text-base leading-snug text-umber">
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>
      <div className="rounded-lg bg-brass/15 p-2">
        <div className="text-sm font-black uppercase tracking-wider text-brass">💡 You&apos;re learning</div>
        <div className="mt-1 text-base leading-snug text-ink">{learning}</div>
      </div>
    </div>
  );
}
