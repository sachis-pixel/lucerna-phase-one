"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { GameProgress, ThemeMode } from "@/engine/types";
import { MAX_LIVES } from "@/engine/types";
import { Hearts, Pipp } from "./ui";
import Stage1 from "./stages/Stage1";
import Stage2 from "./stages/Stage2";
import Stage3 from "./stages/Stage3";
import Stage4 from "./stages/Stage4";

const SAVE_KEY = "lucerna_power_one_save_v1";

interface GameCtx {
  progress: GameProgress;
  setTheme: (t: ThemeMode) => void;
  loseLife: () => void;
  completeStage: (stage: number) => void;
  setNickname: (n: string) => void;
  awardMedal: (m: string) => void;
  restartStage: () => void;
}

const Ctx = createContext<GameCtx | null>(null);
export const useGame = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGame outside GameShell");
  return c;
};

const FRESH: GameProgress = { stage: 1, lives: MAX_LIVES, nickname: null, medals: [], completedStages: [] };

export default function GameShell() {
  const [progress, setProgress] = useState<GameProgress>(FRESH);
  const [hydrated, setHydrated] = useState(false);

  // Load / persist to LocalStorage (zero-login, offline-first)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) setProgress(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
  }, [progress, hydrated]);

  // QA-04: single class flip on <body>, CSS handles the 200ms swap
  const setTheme = useCallback((t: ThemeMode) => {
    document.body.classList.remove("theme-red", "theme-blue");
    document.body.classList.add(t === "training-blue" ? "theme-blue" : "theme-red");
  }, []);

  const loseLife = useCallback(() => {
    setProgress((p) => ({ ...p, lives: Math.max(0, p.lives - 1) }));
  }, []);

  const restartStage = useCallback(() => {
    setProgress((p) => ({ ...p, lives: MAX_LIVES }));
  }, []);

  const completeStage = useCallback((stage: number) => {
    setProgress((p) => ({
      ...p,
      completedStages: Array.from(new Set([...p.completedStages, stage])),
      stage: (Math.min(4, stage + 1) as GameProgress["stage"])
    }));
  }, []);

  const setNickname = useCallback((n: string) => setProgress((p) => ({ ...p, nickname: n })), []);
  const awardMedal = useCallback(
    (m: string) => setProgress((p) => ({ ...p, medals: Array.from(new Set([...p.medals, m])) })),
    []
  );

  if (!hydrated) return null;

  const outOfLives = progress.lives <= 0;

  return (
    <Ctx.Provider value={{ progress, setTheme, loseLife, completeStage, setNickname, awardMedal, restartStage }}>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-8 lg:px-12">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-white/40">Lucerna Academy · Power One</div>
            <h1 className="font-display text-2xl font-black tracking-wide accent-text">The Chaos Forge</h1>
          </div>
          <div className="flex items-center gap-4">
            <StageDots current={progress.stage} done={progress.completedStages} />
            <Hearts lives={progress.lives} />
            <button
              type="button"
              title="Reset all progress"
              onClick={() => {
                window.localStorage.removeItem(SAVE_KEY);
                window.localStorage.removeItem("lucerna_ghost_db_v1");
                setProgress(FRESH);
              }}
              className="text-sm uppercase tracking-wider text-white/40 underline hover:text-white"
            >
              Reset
            </button>
          </div>
        </header>

        {outOfLives ? (
          <div className="space-y-4">
            <Pipp tone="warning">
              Your alchemy health hit zero! The forge sends you back to the start of this stage. Read carefully next
              time…
            </Pipp>
            <button
              type="button"
              onClick={restartStage}
              className="bg-brass rounded-lg px-6 py-2.5 font-black uppercase tracking-wider text-ink hover:brightness-110"
            >
              Restart stage
            </button>
          </div>
        ) : (
          <>
            {progress.stage === 1 && <Stage1 />}
            {progress.stage === 2 && <Stage2 />}
            {progress.stage === 3 && <Stage3 />}
            {progress.stage === 4 && <Stage4 />}
          </>
        )}
      </main>
    </Ctx.Provider>
  );
}

function StageDots({ current, done }: { current: number; done: number[] }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Stage ${current} of 4`}>
      {[1, 2, 3, 4].map((s) => (
        <span
          key={s}
          className={`h-2.5 w-2.5 rounded-full ${
            done.includes(s) ? "bg-brass" : s === current ? "accent-bg animate-pulseglow" : "bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}
