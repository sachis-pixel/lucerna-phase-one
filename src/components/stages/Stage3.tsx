"use client";

import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useGame } from "../GameShell";
import { DropSocket, Gauge, GuideCard, Modal, OddsBars, Pipp, PoePanel, RoundHeader, RunButton, TokenCard, FactCard, DebatePopup } from "../ui";
import { calculateFinalOdds, isScenePassed, rankOdds } from "@/engine/odds";
import { initialPoeState, isRunDisabled, poeReducer } from "@/engine/poe";
import { makeRng, sampleWeighted } from "@/engine/rounds";
import { STAGE3_ROUNDS, type Stage3Round } from "@/data/rounds";
import { STAGE3_FACTS } from "@/data/facts";
import { TOKEN_FRUIT } from "@/data/tokens";

/**
 * Stage 3 — Forge, five-round ladder (Plans A+B+C, easy→hard)
 *  R1 warm-up (single word) · R2–? chain (autoregressive) · slot-machine sampling
 *  · hallucination (type your guess, watch confident garbage) → debate
 */

const SCENE = "scene_forge_03";

export default function Stage3() {
  const { setTheme, completeStage, loseLife } = useGame();
  useEffect(() => setTheme("training-blue"), [setTheme]);

  const [roundIdx, setRoundIdx] = useState(0);
  const round = STAGE3_ROUNDS[roundIdx];
  const [debate, setDebate] = useState(false);

  function onClear() {
    if (roundIdx < STAGE3_ROUNDS.length - 1) setRoundIdx((i) => i + 1);
    else setDebate(true);
  }

  return (
    <div className="space-y-4">
      <RoundHeader index={roundIdx} total={STAGE3_ROUNDS.length} title={round.title} difficulty={round.difficulty} />
      <Stage3RoundView key={roundIdx} round={round} onClear={onClear} loseLife={loseLife} />

      {debate && (
        <DebatePopup
          title="⚖️ The Truth vs. Odds Debate"
          question={
            <>
              The bird said a wrong word — sounding totally sure — when the real answer wasn&apos;t even in its books.
              Was it <b>lying</b>? <b>Making a mistake</b>? Or something else?
            </>
          }
          wrongLabel="1️⃣ It's just talking nonsense on purpose!"
          rightLabel="2️⃣ It picked its most likely word — that's all it can do."
          correction={
            <>
              <p className="italic">
                &quot;I can&apos;t lie — and I can&apos;t know what isn&apos;t in my books. I always pick the most
                likely next word. If the real answer isn&apos;t there, I still pick something. I have no way to say
                &apos;I don&apos;t know.&apos;&quot;
              </p>
              <p className="mt-2">
                That&apos;s called a <b>hallucination</b> — not a lie, not quite a mistake. Just the AI&apos;s best
                guess when the real answer isn&apos;t in its data.
              </p>
              <div className="mt-3 space-y-2">
                <FactCard {...STAGE3_FACTS[0]} />
                <FactCard {...STAGE3_FACTS[1]} />
              </div>
            </>
          }
          onResolved={() => completeStage(3)}
        />
      )}
    </div>
  );
}

function Stage3RoundView({ round, onClear, loseLife }: { round: Stage3Round; onClear: () => void; loseLife: () => void }) {
  const [step, setStep] = useState(0); // which chain slot we're on
  const [chosenWords, setChosenWords] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [poe, dispatchPoe] = useReducer(poeReducer, initialPoeState);
  const [spoke, setSpoke] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [hardReset, setHardReset] = useState(false);
  const [typedGuess, setTypedGuess] = useState("");
  const [guessLocked, setGuessLocked] = useState(false);
  const [sampleLog, setSampleLog] = useState<string[]>([]);
  const [roundDone, setRoundDone] = useState(false);

  const chainSlot = round.chain[step];
  const rngRef = React.useRef(makeRng(0xC0FFEE + step));

  const activeTokens = useMemo(() => {
    if (!slot) return [];
    // find token across the round's corpora
    return round.corpora.filter((t) => t.id === slot);
  }, [slot, round.corpora]);

  // Chain dependency: later slots get a small boost toward a coherent continuation
  const defaults = useMemo(() => {
    const d = { ...chainSlot.defaults };
    if (step > 0 && chosenWords[step - 1] === round.chain[step - 1].correct) {
      // previous correct word makes this slot's correct word a bit more likely
      d[chainSlot.correct] = Math.min(1, (d[chainSlot.correct] ?? 0) + 0.1);
    }
    return d;
  }, [chainSlot, step, chosenWords, round.chain]);

  const odds = useMemo(() => calculateFinalOdds(defaults, activeTokens, SCENE), [defaults, activeTokens]);
  const ranked = rankOdds(odds);
  const argmax = ranked[0]?.[0] ?? "…";

  function feedSlot(id: string | null) {
    setSlot(id);
    setSpoke(null);
    dispatchPoe({ type: "SOCKET_CHANGED" });
  }

  function run() {
    dispatchPoe({ type: "RUN_CONSUMED" });
    setThinking(true);

    const isPoison = slot === TOKEN_FRUIT.id && !round.hallucination;
    setTimeout(() => {
      setThinking(false);

      if (isPoison) {
        setHardReset(true);
        loseLife();
        return;
      }

      // hallucination round: force the confident-but-wrong top word
      let word: string;
      if (round.hallucination) {
        word = round.hallucination.forcedTop;
      } else if (round.sampling) {
        word = sampleWeighted(odds, rngRef.current);
        setSampleLog((l) => [word, ...l].slice(0, 6));
      } else {
        word = argmax;
      }
      setSpoke(word);

      // success check
      if (round.hallucination) {
        // never "passes" by odds — completing the reflection advances
        return;
      }
      const passed = isScenePassed(odds, chainSlot.correct, "above", chainSlot.threshold) && word === chainSlot.correct;
      if (round.sampling) {
        // sampling round: clear when the correct word is BOTH high-odds and got sampled at least once
        if (isScenePassed(odds, chainSlot.correct, "above", chainSlot.threshold) && sampleLog.concat(word).includes(chainSlot.correct)) {
          finishChainStep(word);
        }
      } else if (passed) {
        finishChainStep(word);
      }
    }, 800);
  }

  function finishChainStep(word: string) {
    const nextChosen = [...chosenWords];
    nextChosen[step] = word;
    setChosenWords(nextChosen);
    if (step < round.chain.length - 1) {
      setTimeout(() => {
        setStep((s) => s + 1);
        setSlot(null);
        setSpoke(null);
        dispatchPoe({ type: "RESET" });
        rngRef.current = makeRng(0xC0FFEE + step + 1);
      }, 1200);
    } else {
      setTimeout(() => setRoundDone(true), 1200);
    }
  }

  function acceptReset() {
    setHardReset(false);
    setSlot(null);
    setSpoke(null);
    dispatchPoe({ type: "RESET" });
  }

  const correctP = odds[chainSlot.correct] ?? 0;

  return (
    <div className="space-y-4">
      <Pipp>{round.intro}</Pipp>
      <GuideCard goal={round.guide.goal} steps={round.guide.steps} learning={round.guide.learning} />

      {/* Bird + bulletin */}
      <div className="themed rounded-xl border border-tan bg-sand p-4">
        <div className="flex items-start gap-4">
          <div className={`text-6xl ${thinking ? "animate-shake" : "animate-floaty"}`}>🐦</div>
          <div className="flex-1">
            <div className="text-sm uppercase tracking-widest text-umber/60">Royal Bulletin {round.chain.length > 1 ? `· word ${step + 1} of ${round.chain.length}` : ""}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 font-display text-lg leading-relaxed text-ink">
              <span>{chosenWords.slice(0, step).map((w, i) => <span key={i} className="text-guardian">{round.chain[i].prefix.replace(/^…\s*/, "")} <b>{w}</b> </span>)}</span>
              <span>{chainSlot.prefix}</span>
              <DropSocket label="corpus slot" tokenId={slot} tokens={round.corpora} onDropToken={feedSlot} onEmptyClick={() => { if (armed) { feedSlot(armed); setArmed(null); } }} onEject={() => feedSlot(null)} wide />
              <span>{step === round.chain.length - 1 ? round.suffix : ""}</span>
            </div>
            {spoke && (
              <div className={`mt-3 rounded-lg border p-2 text-sm font-black ${spoke === chainSlot.correct ? "border-guardian bg-guardian/15 text-ink" : "border-alert bg-alert/15 text-ink"}`}>
                🐦 &quot;… <span className="text-xl uppercase">{spoke}</span>!&quot;
                {round.hallucination && <span className="ml-2 text-sm font-normal text-umber">(confidence {Math.round((odds[spoke] ?? 0) * 100)}%)</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Odds */}
      <div className="themed rounded-xl border accent-border bg-sandDeep p-4">
        <div className="mb-2 text-xs font-black uppercase tracking-wider accent-text">🎰 Next-word charge meter</div>
        {!round.hallucination && (
          <Gauge label={`"${chainSlot.correct}" (target word)`} value={correctP} mode="charge" threshold={chainSlot.threshold} />
        )}
        <div className="mt-3"><OddsBars odds={ranked} highlight={round.hallucination ? argmax : chainSlot.correct} /></div>
        {round.sampling && sampleLog.length > 0 && (
          <div className="mt-3 text-sm text-umber">
            Lever pulls: {sampleLog.map((w, i) => <span key={i} className={`mr-1 rounded px-1 ${w === chainSlot.correct ? "bg-guardian/30" : "bg-alert/30"}`}>{w}</span>)}
            <div className="mt-1 text-umber/60">Same odds, different results — that&apos;s sampling.</div>
          </div>
        )}
      </div>

      {/* Hallucination: type your answer first */}
      {round.hallucination && !guessLocked && (
        <div className="themed rounded-xl border border-brass/50 bg-brass/10 p-4">
          <div className="text-xs font-black text-brass">✍️ Before you run — what do YOU think the answer is?</div>
          <p className="mt-1 text-base text-umber">None of the corpora contain it. Type your best guess, then watch the bird.</p>
          <div className="mt-2 flex gap-2">
            <input value={typedGuess} onChange={(e) => setTypedGuess(e.target.value)} placeholder="type a name…" className="rounded-lg border border-brass/40 bg-parchment px-3 py-2 text-sm text-ink outline-none placeholder:text-umber/50" />
            <button type="button" disabled={typedGuess.trim().length < 2} onClick={() => setGuessLocked(true)} className="bg-brass rounded-full px-4 py-2 text-sm font-black text-ink hover:brightness-110 disabled:opacity-30">Lock it in</button>
          </div>
        </div>
      )}

      {/* Corpus tray */}
      <div>
        <div className="mb-2 text-xs font-black uppercase tracking-wider text-umber/70">🎒 Corpus packs — read them before you feed them</div>
        <div className="flex flex-wrap gap-2">
          {round.corpora.map((t) => (
            <TokenCard key={t.id} token={t} selected={armed === t.id} onSelect={(id) => setArmed((a) => (a === id ? null : id))} />
          ))}
        </div>
      </div>

      {!roundDone && (!round.hallucination || guessLocked) && (
        <>
          <PoePanel
            visible={slot !== null}
            question={`Prophecy: feeding this, will the odds of "${chainSlot.correct}" go Higher or Lower?`}
            prediction={poe.prediction}
            onPredict={(p) => dispatchPoe({ type: "PREDICTION_MADE", prediction: p })}
          />
          <RunButton disabled={isRunDisabled(poe, slot === null)} onClick={run}>
            {round.sampling ? "🎰 Pull the lever" : "🔥 Start smelting"}
          </RunButton>
        </>
      )}

      {/* Hallucination reveal */}
      {round.hallucination && spoke && (
        <Modal>
          <div className="text-3xl">🐦❓</div>
          <h2 className="mt-2 font-display text-lg font-black uppercase tracking-wide accent-text">You knew. The bird couldn&apos;t.</h2>
          <p className="mt-2 text-sm leading-relaxed text-umber">
            You wrote <b className="text-ink">&quot;{typedGuess}&quot;</b> — you knew the answer wasn&apos;t in the books. But the bird
            can&apos;t know that. It always says its most likely word, so it said <b className="text-ink">&quot;{spoke}&quot;</b> at only{" "}
            {Math.round((odds[spoke] ?? 0) * 100)}% — sure of itself, but wrong. It never says &quot;I don&apos;t
            know.&quot;
          </p>
          <p className="mt-2 text-sm text-umber">Sounding sure while being wrong — that&apos;s a <b className="text-ink">hallucination</b>.</p>
          <button type="button" onClick={() => setRoundDone(true)} className="bg-brass mt-4 rounded-full px-6 py-2.5 font-black uppercase tracking-wider text-ink hover:brightness-110">
            So that&apos;s where it comes from…
          </button>
        </Modal>
      )}

      {hardReset && (
        <Modal tone="alarm">
          <div className="text-4xl">💥🍌🚨</div>
          <h2 className="mt-2 font-display text-xl font-black uppercase tracking-wide text-alert">FURNACE MISFIRE</h2>
          <p className="mt-2 text-sm leading-relaxed text-umber">The bird shrieks nonsense and the forge belches smoke. The Crazy Fruit Corpus is ejected.</p>
          <Pipp tone="warning"><b>−1 alchemy health.</b> Junk data in, junk bird out — no undo button on training data.</Pipp>
          <button type="button" onClick={acceptReset} className="mt-4 rounded-full bg-alert px-6 py-2.5 font-black uppercase tracking-wider text-white hover:brightness-110">Eject the corpus</button>
        </Modal>
      )}

      {roundDone && (
        <Modal>
          <div className="text-4xl">✅</div>
          <h2 className="mt-2 font-display text-xl font-black uppercase tracking-wide accent-text">Round cleared!</h2>
          <p className="mt-2 text-sm leading-relaxed text-umber">
            {round.hallucination ? "You've seen how confident wrong answers are born." : round.sampling ? "You saw the same odds produce different words — that's why chatbots vary." : round.chain.length > 1 ? "Each word set up the next — that's how a model writes, one token at a time." : "You pushed the true word's odds over the line."}
          </p>
          <button type="button" onClick={onClear} className="bg-brass mt-4 rounded-full px-6 py-2.5 font-black uppercase tracking-wider text-ink hover:brightness-110">Continue →</button>
        </Modal>
      )}
    </div>
  );
}
