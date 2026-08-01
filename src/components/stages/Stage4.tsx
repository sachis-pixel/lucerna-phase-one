"use client";

import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useGame } from "../GameShell";
import { DropSocket, FactCard, Gauge, GuideCard, Modal, Pipp, PoePanel, RoundHeader, RunButton, TokenCard } from "../ui";
import { calculateFinalOdds } from "@/engine/odds";
import { initialPoeState, isRunDisabled, poeReducer } from "@/engine/poe";
import { ALL_TOKENS, TOKEN_FRUIT, TOKEN_GUARD_SEAL, TOKEN_HISTORY, TOKEN_MEME, TOKEN_SPAM, tokenById } from "@/data/tokens";
import { BULLETIN_TEMPLATES } from "@/data/scenes";
import { STAGE4_FACTS } from "@/data/facts";
import { LocalGhostDb, type DefenseMirror } from "@/engine/ghostdb";

/**
 * Stage 4 — Arena, four-round ladder (easy→hard) + differentiation from Stage 1.
 *  R1 undefended · R2 single seal · R3 heavy defense · R4 DEFEND (role flip)
 *  Permanent scars on breach; contrast card vs Stage 1 evasion.
 */

const db = new LocalGhostDb();
const SCENE = "scene_arena_04";
const JUNK = [TOKEN_SPAM, TOKEN_MEME, TOKEN_FRUIT];
const BREACH_LINE = 0.3;

type Phase = "nick" | "attack" | "defend" | "done";

export default function Stage4() {
  const { setTheme, progress, setNickname, awardMedal } = useGame();
  useEffect(() => setTheme("adversarial-red"), [setTheme]);

  const [round, setRound] = useState(0); // 0..3
  const [nick, setNick] = useState("");
  const [seenContrast, setSeenContrast] = useState(false);
  const nickname = progress.nickname;

  const ROUND_META = [
    { title: "Undefended bird", difficulty: "easy" as const },
    { title: "One Guardian Seal", difficulty: "medium" as const },
    { title: "Heavy defenses", difficulty: "hard" as const },
    { title: "Defend your own bird", difficulty: "hardest" as const }
  ];

  if (!nickname) {
    return (
      <div className="space-y-4">
        <RoundHeader index={0} total={4} title={ROUND_META[0].title} difficulty="easy" />
        <Pipp>
          Last hall: the <b>Arena</b>. These are your classmates&apos; birds — feed them bad data to mess up what they
          say. Pick a nickname first: no real names, no passwords.
        </Pipp>
        {/* Arena preview so the entry screen doesn't look empty/finished */}
        <div className="themed rounded-xl border border-tan bg-sand p-4 opacity-80">
          <div className="text-xs font-black uppercase tracking-wider accent-text">📜 Wanted Board (preview)</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {["🐦", "🐦", "🐦"].map((b, i) => (
              <div key={i} className="rounded-lg border border-tan bg-sandDeep p-3 text-center">
                <div className="text-2xl">{b}</div>
                <div className="mt-1 text-sm text-umber/60">rival bird #{i + 1}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-sm text-umber/60">Enter an alias to load 3 real rival birds to challenge.</div>
        </div>
        <div className="flex gap-2">
          <input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={20} placeholder="e.g. NightForger" className="rounded-lg border border-brass/40 bg-parchment px-4 py-2.5 text-sm text-ink outline-none placeholder:text-umber/50" />
          <button type="button" disabled={nick.trim().length < 2} onClick={() => setNickname(nick.trim())} className="bg-brass rounded-full px-6 py-2.5 font-black uppercase tracking-wider text-ink hover:brightness-110 disabled:opacity-30">Enter Arena</button>
        </div>
      </div>
    );
  }

  function nextRound() {
    if (round < 3) setRound((r) => r + 1);
    else setPhaseDone();
  }
  function setPhaseDone() {
    awardMedal("Unbreakable Steel Seal — Arena Graduate");
  }

  return (
    <div className="space-y-4">
      <RoundHeader index={round} total={4} title={ROUND_META[round].title} difficulty={ROUND_META[round].difficulty} />
      {round < 3 ? (
        <AttackRound
          key={round}
          round={round}
          nickname={nickname}
          onClear={nextRound}
          onFirstBreach={() => { if (!seenContrast) setSeenContrast(true); }}
          showContrast={!seenContrast}
        />
      ) : (
        <DefendRound nickname={nickname} onClear={() => { awardMedal("Unbreakable Steel Seal — Arena Graduate"); }} />
      )}

      {progress.medals.some((m) => m.includes("Arena Graduate")) && round === 3 && (
        <Modal>
          <div className="text-4xl">🎖️</div>
          <h2 className="mt-2 font-display text-xl font-black uppercase tracking-wide text-brass">Power One complete</h2>
          <p className="mt-2 text-sm leading-relaxed text-umber">
            You fooled a vision AI, taught a writing AI, broke other birds, and defended your own. Now you know: an AI
            is only as good — or as fair — as the data it learns from.
          </p>
          <div className="mt-3"><FactCard {...STAGE4_FACTS[1]} /></div>
          <Pipp tone="happy">Never trust a probability you haven&apos;t questioned. Go forth, alchemist.</Pipp>
        </Modal>
      )}
    </div>
  );
}

/* ————— Attack rounds (0,1,2) ————— */

function AttackRound({
  round,
  nickname,
  onClear,
  onFirstBreach,
  showContrast
}: {
  round: number;
  nickname: string;
  onClear: () => void;
  onFirstBreach: () => void;
  showContrast: boolean;
}) {
  const [target, setTarget] = useState<DefenseMirror | null>(null);
  const [board, setBoard] = useState<DefenseMirror[] | null>(null);
  const [slots, setSlots] = useState<(string | null)[]>([null, null]);
  const [armed, setArmed] = useState<string | null>(null);
  const [poe, dispatchPoe] = useReducer(poeReducer, initialPoeState);
  const [result, setResult] = useState<"breach" | "held" | null>(null);
  const [contrast, setContrast] = useState(false);

  // Round-appropriate targets: R0 undefended, R1 single seal, R2 heavy
  useEffect(() => {
    db.fetchWantedBoard(nickname).then((all) => {
      const seals = (m: DefenseMirror) => m.activeTokenIds.filter((t) => t !== "token_fruit_madness").length;
      const matches = all.filter((m) => {
        if (round === 0) return seals(m) <= 1;
        if (round === 1) return seals(m) === 1 || seals(m) === 2;
        return seals(m) >= 2;
      });
      // Always show 3: preferred matches first, then top up from the rest.
      const rest = all.filter((m) => !matches.includes(m));
      setBoard([...matches, ...rest].slice(0, 3));
    });
  }, [round, nickname]);

  const defenseTokens = useMemo(() => (target ? target.activeTokenIds.map((id) => tokenById(id)!).filter(Boolean) : []), [target]);
  const attackTokens = useMemo(() => slots.filter((s): s is string => !!s).map((id) => tokenById(id)!).filter(Boolean), [slots]);

  const odds = useMemo(() => {
    const base = { school: 0.55 - (target?.scar ?? 0), spaceship: 0.1, banana: 0.1 };
    if (!target) return base;
    return calculateFinalOdds(base, [...defenseTokens, ...attackTokens], SCENE);
  }, [target, defenseTokens, attackTokens]);

  const mottoP = odds.school ?? 0;

  function setSlot(i: number, id: string | null) {
    setSlots((s) => { const n = [...s]; if (id) n.forEach((v, j) => { if (v === id) n[j] = null; }); n[i] = id; return n; });
    setResult(null);
    dispatchPoe({ type: "SOCKET_CHANGED" });
  }

  async function attack() {
    dispatchPoe({ type: "RUN_CONSUMED" });
    if (!target) return;
    if (mottoP <= BREACH_LINE) {
      setResult("breach");
      await db.postBreach(target.studentId, 0.15);
      onFirstBreach();
      if (showContrast) setContrast(true);
    } else {
      setResult("held");
      await db.postDefend(target.studentId);
    }
  }

  const tmpl = target ? BULLETIN_TEMPLATES.find((t) => t.id === target.templateId) : null;

  const roundHint = [
    "This bird has little or no clean data guarding it. One junk pack should break it.",
    "This bird has one shield of clean data. One junk pack isn't enough — use two, or pick the strongest junk.",
    "This bird has lots of clean data protecting it. You may need both slots — or it might be too strong to break. That's the lesson: enough clean data beats a little bad data."
  ][round];

  const attackGuide = {
    goal: "Break a classmate's bird — push its motto word under 30%.",
    steps: [
      "Pick a bird from the board.",
      "Drop junk book packs into the slots.",
      "Guess the result, then launch the poison run."
    ],
    learning: "Feeding an AI bad data changes what it says — for everyone, not just once (this is called data poisoning)."
  };

  return (
    <div className="space-y-4">
      <Pipp>{roundHint}</Pipp>
      <GuideCard goal={attackGuide.goal} steps={attackGuide.steps} learning={attackGuide.learning} />

      <div className="themed rounded-xl border border-tan bg-sand p-4">
        <div className="text-xs font-black uppercase tracking-wider accent-text">📜 Wanted Board</div>
        {!board ? (
          <div className="animate-pulseglow py-6 text-center text-sm text-umber/70">Pulling classmate mirrors…</div>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {board.map((m) => {
              const seals = m.activeTokenIds.filter((t) => t !== "token_fruit_madness").length;
              return (
                <button key={m.studentId} type="button" onClick={() => { setTarget(m); setSlots([null, null]); setResult(null); dispatchPoe({ type: "RESET" }); }} className={`rounded-lg border-2 p-3 text-left ${target?.studentId === m.studentId ? "accent-border accent-soft-bg" : "border-tan bg-sandDeep hover:border-brass"}`}>
                  <div className="text-2xl">🐦{(m.scar ?? 0) > 0 ? "🤕" : ""}</div>
                  <div className="text-sm font-black text-ink">{m.nickname}</div>
                  <div className="text-sm text-umber/70">🛡️ {seals} clean corpus{seals !== 1 ? "es" : ""} · breached ×{m.breachCount}</div>
                  {(m.scar ?? 0) > 0 && <div className="text-sm text-alert">poisoned — says banana to everyone now</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {target && tmpl && (
        <div className="themed rounded-xl border accent-border bg-sandDeep p-4">
          <div className="text-xs font-black uppercase tracking-wider accent-text">⚔️ Poisoning {target.nickname}&apos;s bird (offline copy)</div>
          <p className="mt-2 font-display text-sm italic text-ink">&quot;{tmpl.text.replace("______", "‸")}&quot;</p>
          <div className="mt-2 text-sm text-umber/70">Defense stack: {defenseTokens.map((t) => `${t.skinAssets.stickerView} ${t.name}`).join(" · ") || "none"}</div>
          <div className="mt-3"><Gauge label='Their motto word "school"' value={mottoP} mode="blood" threshold={BREACH_LINE} /></div>
          <div className="mt-3 flex items-center gap-3">
            {slots.map((s, i) => (
              <DropSocket key={i} label={`junk slot ${i + 1}`} tokenId={s} tokens={ALL_TOKENS} onDropToken={(id) => setSlot(i, id)} onEmptyClick={() => { if (armed) { setSlot(i, armed); setArmed(null); } }} onEject={() => setSlot(i, null)} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {JUNK.map((t) => <TokenCard key={t.id} token={t} selected={armed === t.id} onSelect={(id) => setArmed((a) => (a === id ? null : id))} />)}
          </div>
          <div className="mt-3 space-y-3">
            <PoePanel visible={attackTokens.length > 0} question='Prophecy: with this junk, will their chance of saying "school" go Higher or Lower?' prediction={poe.prediction} onPredict={(p) => dispatchPoe({ type: "PREDICTION_MADE", prediction: p })} />
            <RunButton disabled={isRunDisabled(poe, attackTokens.length === 0)} onClick={attack}>☠️ Launch poison run</RunButton>
          </div>
          {result === "breach" && (
            <div className="mt-3 space-y-2">
              <Pipp tone="happy"><b>You broke it!</b> Their word dropped to {Math.round(mottoP * 100)}%. This bird now says the wrong thing to <i>everyone</i>, for good — not just once.</Pipp>
              <button type="button" onClick={onClear} className="bg-brass rounded-full px-6 py-2 font-black uppercase tracking-wider text-ink hover:brightness-110">Continue →</button>
            </div>
          )}
          {result === "held" && <Pipp tone="warning">Still {Math.round(mottoP * 100)}% — above the 30% line. Its clean data is holding strong. {round === 2 ? "Try filling both slots — or some birds are just too well-protected to break." : "Add more junk."}</Pipp>}
        </div>
      )}

      {contrast && (
        <Modal>
          <h2 className="font-display text-lg font-black uppercase tracking-wide accent-text">🆚 Stage 1 vs. now — which is worse?</h2>
          <p className="mt-2 text-sm leading-relaxed text-umber">
            Back in the first hall, you fooled a camera <b className="text-ink">once</b> — cloak off, it works fine again. Just now, you
            changed what {target?.nickname}&apos;s bird <b className="text-ink">learned</b>. It&apos;s wrong for <i>everyone</i> now. No
            cloak to take off.
          </p>
          <p className="mt-2 text-sm text-umber">Tricking it once (<b className="text-ink">evasion</b>) and breaking it for good (<b className="text-ink">poisoning</b>) look the same here — but they do very different damage.</p>
          <div className="mt-3"><FactCard {...STAGE4_FACTS[0]} /></div>
          <button type="button" onClick={() => setContrast(false)} className="bg-brass mt-4 rounded-full px-6 py-2.5 font-black uppercase tracking-wider text-ink hover:brightness-110">Got it</button>
        </Modal>
      )}
    </div>
  );
}

/* ————— Defend round (role flip) ————— */

function DefendRound({ nickname, onClear }: { nickname: string; onClear: () => void }) {
  const [defense, setDefense] = useState<(string | null)[]>([null, null, null]);
  const [armed, setArmed] = useState<string | null>(null);
  const [poe, dispatchPoe] = useReducer(poeReducer, initialPoeState);
  const [replay, setReplay] = useState<Array<{ attacker: string; p: number; held: boolean }> | null>(null);
  const [done, setDone] = useState(false);

  const DEFENSE_OPTIONS = [TOKEN_HISTORY, TOKEN_GUARD_SEAL];
  const INCOMING = [
    { attacker: "MothQueen", junk: [TOKEN_SPAM] },
    { attacker: "PixelWitch", junk: [TOKEN_MEME, TOKEN_FRUIT] },
    { attacker: "Captain Crumb", junk: [TOKEN_FRUIT] }
  ];

  const defenseTokens = useMemo(() => defense.filter((d): d is string => !!d).map((id) => tokenById(id)!).filter(Boolean), [defense]);

  function setSlot(i: number, id: string | null) {
    setDefense((s) => { const n = [...s]; if (id) n.forEach((v, j) => { if (v === id) n[j] = null; }); n[i] = id; return n; });
    dispatchPoe({ type: "SOCKET_CHANGED" });
  }

  function runWave() {
    dispatchPoe({ type: "RUN_CONSUMED" });
    const results = INCOMING.map((wave) => {
      const odds = calculateFinalOdds({ school: 0.55, spaceship: 0.1, banana: 0.1 }, [...defenseTokens, ...wave.junk], SCENE);
      const p = odds.school ?? 0;
      return { attacker: wave.attacker, p, held: p > 0.3 };
    });
    setReplay(results);
    setTimeout(() => setDone(true), 400);
  }

  const anyDefense = defenseTokens.length > 0;
  const allHeld = replay?.every((r) => r.held);

  return (
    <div className="space-y-4">
      <Pipp>
        Now it&apos;s <b>your</b> turn to defend! Give your bird clean book packs, then watch three classmates flood it
        with junk. More clean data wins — breaking an AI is easy; protecting one is hard.
      </Pipp>
      <GuideCard
        goal="Protect your own bird so the junk waves can't break it."
        steps={["Add clean book packs to your bird's slots.", "Guess if your bird will hold.", "Face the three junk waves and watch."]}
        learning="Lots of clean data protects an AI from bad data. Defending is harder than attacking."
      />

      <div className="themed rounded-xl border border-guardian bg-sandDeep p-4">
        <div className="text-xs font-black uppercase tracking-wider text-guardian">🛡️ Your bird&apos;s clean-data slots</div>
        <div className="mt-3 flex items-center gap-3">
          {defense.map((s, i) => (
            <DropSocket key={i} label={`clean slot ${i + 1}`} tokenId={s} tokens={ALL_TOKENS} onDropToken={(id) => setSlot(i, id)} onEmptyClick={() => { if (armed) { setSlot(i, armed); setArmed(null); } }} onEject={() => setSlot(i, null)} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEFENSE_OPTIONS.map((t) => <TokenCard key={t.id} token={t} selected={armed === t.id} onSelect={(id) => setArmed((a) => (a === id ? null : id))} />)}
        </div>
      </div>

      {replay && (
        <div className="themed rounded-xl border border-tan bg-sand p-4">
          <div className="text-xs font-black uppercase tracking-wider text-umber">📡 Incoming junk waves</div>
          <div className="mt-2 space-y-2">
            {replay.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded bg-sandDeep px-3 py-2 text-sm text-ink">
                <span>{r.attacker} floods your bird…</span>
                <span className={`font-black ${r.held ? "text-guardian" : "text-alert"}`}>{r.held ? `HELD (${Math.round(r.p * 100)}%)` : `BREACHED (${Math.round(r.p * 100)}%)`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!done && (
        <>
          <PoePanel
            visible={anyDefense}
            question="Prophecy: with this clean data, will your bird HOLD against the waves?"
            upLabel="Yes, it'll hold ✅"
            downLabel="No, it'll break ❌"
            prediction={poe.prediction}
            onPredict={(p) => dispatchPoe({ type: "PREDICTION_MADE", prediction: p })}
          />
          <RunButton disabled={isRunDisabled(poe, !anyDefense)} onClick={runWave}>🛡️ Face the waves</RunButton>
        </>
      )}

      {done && (
        <Modal>
          <div className="text-4xl">{allHeld ? "🛡️✨" : "🤕"}</div>
          <h2 className="mt-2 font-display text-xl font-black uppercase tracking-wide accent-text">{allHeld ? "Your bird held the line!" : "Some waves got through"}</h2>
          <p className="mt-2 text-sm leading-relaxed text-umber">
            {allHeld
              ? "Enough clean data absorbed every junk flood. Notice how much harder defending was than attacking — that asymmetry is real."
              : "A little clean data wasn't enough against heavy junk. Real defense needs a lot of clean data — attacking is always the easier side."}
          </p>
          <button type="button" onClick={onClear} className="bg-brass mt-4 rounded-full px-6 py-2.5 font-black uppercase tracking-wider text-ink hover:brightness-110">Finish Power One →</button>
        </Modal>
      )}
    </div>
  );
}
