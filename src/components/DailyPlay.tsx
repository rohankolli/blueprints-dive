"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { hasCompletedToday, loadProgress, recordCompletion } from "@/lib/progress";
import { dayBand, pointsToKm, TIER_GLYPHS, TIER_LABELS } from "@/lib/tiers";
import type { DailyMeta, DayResult, PromptResult, ScoreResult, TierKey } from "@/lib/types";

type Phase = "loading" | "ready" | "countdown" | "answering" | "feedback" | "results" | "blocked";

const READ_SECONDS = 3;
const ANSWER_SECONDS = 25;

export function DailyPlay() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [daily, setDaily] = useState<(DailyMeta & { timerSeconds: number }) | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(ANSWER_SECONDS);
  const [readLeft, setReadLeft] = useState(READ_SECONDS);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<ScoreResult | null>(null);
  const [missMessage, setMissMessage] = useState<string | null>(null);
  const [results, setResults] = useState<PromptResult[]>([]);
  const [dayResult, setDayResult] = useState<DayResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState(0);
  const [studyOpen, setStudyOpen] = useState(false);
  const [studySheet, setStudySheet] = useState<
    Array<{ id: string; text: string; answers: Array<{ canonical: string; tier: TierKey; points: number; isGem: boolean }> }>
  >([]);

  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<PromptResult[]>([]);
  const guessRef = useRef("");
  const timedOutRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const progress = loadProgress();
      const res = await fetch("/api/daily");
      const data = await res.json();
      if (cancelled) return;
      setDaily(data);
      setStreak(progress.streak);

      if (hasCompletedToday(data.diveDate) && progress.resultsByDate[data.diveDate]) {
        setDayResult(progress.resultsByDate[data.diveDate]);
        setPhase("results");
        return;
      }

      setPhase("ready");
    })().catch(() => {
      if (!cancelled) setPhase("blocked");
    });

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, []);

  const current = daily?.prompts[promptIndex];
  const totalKm = useMemo(
    () => pointsToKm(results.reduce((s, r) => s + r.points, 0)),
    [results],
  );

  const startCountdown = () => {
    setFeedback(null);
    setMissMessage(null);
    setGuess("");
    guessRef.current = "";
    timedOutRef.current = false;
    setReadLeft(READ_SECONDS);
    setPhase("countdown");
  };

  const pushResult = useCallback((entry: PromptResult) => {
    resultsRef.current = [...resultsRef.current, entry];
    setResults(resultsRef.current);
  }, []);

  const handleTimeout = useCallback(() => {
    if (timedOutRef.current) return;
    timedOutRef.current = true;
    const prompt = daily?.prompts[promptIndex];
    if (!prompt || !daily) return;
    const entry: PromptResult = {
      promptId: prompt.id,
      index: prompt.index,
      text: prompt.text,
      guess: guessRef.current.trim(),
      accepted: false,
      points: 0,
      tier: null,
      tierLabel: null,
      canonical: null,
      isGem: false,
      timedOut: true,
    };
    pushResult(entry);
    setFeedback({
      accepted: false,
      points: 0,
      tier: null,
      tierLabel: null,
      canonical: null,
      isGem: false,
      kmShipped: 0,
      message: "Time’s up — this crate stays on the dock.",
    });
    setPhase("feedback");
  }, [daily, promptIndex, pushResult]);

  useEffect(() => {
    if (phase !== "countdown") return;
    clearTimer();
    let left = READ_SECONDS;
    timerRef.current = window.setInterval(() => {
      left -= 1;
      setReadLeft(left);
      if (left <= 0) {
        clearTimer();
        const answerSeconds = daily?.timerSeconds ?? ANSWER_SECONDS;
        setSecondsLeft(answerSeconds);
        setPhase("answering");
      }
    }, 1000);
    return clearTimer;
  }, [phase, daily?.timerSeconds]);

  useEffect(() => {
    if (phase !== "answering") return;
    clearTimer();
    timedOutRef.current = false;
    inputRef.current?.focus();
    let left = daily?.timerSeconds ?? ANSWER_SECONDS;
    timerRef.current = window.setInterval(() => {
      left -= 1;
      setSecondsLeft(left);
      if (left <= 0) {
        clearTimer();
        handleTimeout();
      }
    }, 1000);
    return clearTimer;
  }, [phase, promptIndex, daily?.timerSeconds, handleTimeout]);

  const finishDay = useCallback(async () => {
    if (!daily) return;
    setBusy(true);
    try {
      const res = await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diveDate: daily.diveDate,
          prompts: resultsRef.current.map((p) => ({
            promptId: p.promptId,
            guess: p.guess,
            accepted: p.accepted,
            points: p.points,
            tier: p.tier,
            tierLabel: p.tierLabel,
            canonical: p.canonical,
            isGem: p.isGem,
            timedOut: p.timedOut,
          })),
        }),
      });
      const payload = await res.json();
      const saved = recordCompletion(daily.diveDate, {
        diveDate: payload.diveDate,
        diveNumber: payload.diveNumber,
        totalPoints: payload.totalPoints,
        kmShipped: payload.kmShipped,
        band: payload.band,
        bandLabel: payload.bandLabel,
        prompts: payload.prompts,
        shareText: payload.shareText,
        status: payload.status,
      });
      setStreak(saved.streak);
      setDayResult(payload);
      setStudySheet(payload.studySheet ?? []);
      setPhase("results");
    } finally {
      setBusy(false);
    }
  }, [daily]);

  const advanceOrFinish = useCallback(async () => {
    if (!daily) return;
    if (promptIndex >= daily.prompts.length - 1) {
      await finishDay();
      return;
    }
    setPromptIndex((i) => i + 1);
    startCountdown();
  }, [daily, finishDay, promptIndex]);

  async function submitGuess(e?: FormEvent) {
    e?.preventDefault();
    if (!current || !daily || busy || phase !== "answering") return;
    const trimmed = guess.trim();
    if (!trimmed) return;

    setBusy(true);
    setMissMessage(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diveDate: daily.diveDate,
          promptId: current.id,
          guess: trimmed,
        }),
      });
      const data: ScoreResult & { error?: string; code?: string } = await res.json();
      if (!res.ok) {
        setMissMessage(data.error ?? "Could not score that answer.");
        return;
      }

      if (!data.accepted) {
        setMissMessage(data.message);
        return;
      }

      clearTimer();
      const entry: PromptResult = {
        promptId: current.id,
        index: current.index,
        text: current.text,
        guess: trimmed,
        accepted: true,
        points: data.points,
        tier: data.tier,
        tierLabel: data.tierLabel,
        canonical: data.canonical,
        isGem: data.isGem,
        timedOut: false,
      };
      pushResult(entry);
      setFeedback(data);
      setPhase("feedback");
    } finally {
      setBusy(false);
    }
  }

  async function copyShare() {
    if (!dayResult?.shareText) return;
    try {
      await navigator.clipboard.writeText(dayResult.shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (phase === "loading") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-5 py-16">
        <p className="text-ink-soft">Loading today’s shipment…</p>
      </main>
    );
  }

  if (phase === "blocked" || !daily) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-4 px-5 py-16">
        <h1 className="display text-3xl">Couldn’t load Daily Shipment</h1>
        <Link href="/" className="btn-primary">
          Back home
        </Link>
      </main>
    );
  }

  if (phase === "results" && dayResult) {
    const band = dayBand(dayResult.totalPoints);
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 pb-16 pt-4">
        <div className="animate-rise surface p-6 sm:p-8">
          <p className="badge badge-warn w-fit">Placeholder shipment</p>
          <h1 className="display mt-3 text-4xl tracking-tight sm:text-5xl">Shipment complete</h1>
          <p className="mt-2 text-ink-soft">
            Surplus #{dayResult.diveNumber} · {dayResult.totalPoints}/700 · {dayResult.kmShipped} km shipped
          </p>
          <p className="mt-4 display text-2xl text-teal-deep">{band.bandLabel}</p>
          <p className="mt-1 text-sm text-ink-soft">Streak {streak}</p>

          <div className="mt-6 flex flex-wrap gap-2 text-2xl" aria-label="Tier row">
            {dayResult.prompts.map((p) => (
              <span key={p.promptId} title={p.tierLabel ?? "Miss"}>
                {p.accepted && p.tier ? TIER_GLYPHS[p.tier] : "⬜"}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={() => void copyShare()}>
              {copied ? "Copied" : "Copy result"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setStudyOpen((v) => !v)}>
              {studyOpen ? "Hide study sheet" : "Study sheet"}
            </button>
            <Link href="/" className="btn-ghost">
              Home
            </Link>
          </div>

          <pre className="mt-5 overflow-x-auto rounded-xl bg-[rgba(21,38,46,0.06)] p-4 text-sm text-ink-soft">
            {dayResult.shareText}
          </pre>
        </div>

        <section className="space-y-3">
          <h2 className="display text-2xl">Manifest breakdown</h2>
          {dayResult.prompts.map((p) => (
            <article key={p.promptId} className="surface p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                Prompt {p.index}
              </p>
              <p className="mt-1 font-semibold">{p.text}</p>
              <p className="mt-2 text-sm text-ink-soft">
                Your answer: <span className="text-ink">{p.guess || "—"}</span>
                {p.timedOut ? " (timed out)" : ""}
              </p>
              <p className="mt-1 text-sm">
                {p.accepted
                  ? `${p.tierLabel} · ${p.points} pts · matched “${p.canonical}”`
                  : "No match · 0 pts"}
              </p>
            </article>
          ))}
        </section>

        {studyOpen && studySheet.length > 0 ? (
          <section className="space-y-3">
            <h2 className="display text-2xl">Study sheet</h2>
            <p className="text-sm text-ink-soft">Unlocked after finishing — placeholder bank.</p>
            {studySheet.map((sheet, i) => (
              <article key={sheet.id} className="surface p-4">
                <p className="font-semibold">
                  {i + 1}. {sheet.text}
                </p>
                <ul className="mt-2 columns-1 gap-3 text-sm sm:columns-2">
                  {sheet.answers.map((a) => (
                    <li key={a.canonical} className="break-inside-avoid py-0.5">
                      <span className="font-medium">{a.canonical}</span>
                      <span className="text-ink-soft">
                        {" "}
                        · {TIER_LABELS[a.tier]} ({a.points}
                        {a.isGem ? " · gem" : ""})
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        ) : null}

        <p className="text-sm text-ink-soft">
          Inspired by rare-answer daily games; original Surplus theme for{" "}
          <a className="underline" href="https://www.blueprintsforpangaea.org/" target="_blank" rel="noreferrer">
            Blueprints for Pangaea
          </a>
          . Join a chapter or volunteer after you play.
        </p>
      </main>
    );
  }

  if (phase === "ready") {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-5 py-12">
        <div className="animate-rise surface p-6 sm:p-8">
          <p className="badge badge-warn w-fit">Sample · placeholder prompts</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl">Daily Shipment #{daily.diveNumber}</h1>
          <p className="mt-3 max-w-xl text-ink-soft">
            Seven prompts. About {daily.timerSeconds ?? ANSWER_SECONDS} seconds each. One attempt today
            (resets midnight {daily.timezone}). Rarer accepted answers ship farther.
          </p>
          <button type="button" className="btn-primary mt-6" onClick={startCountdown}>
            Open the warehouse
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 pb-16 pt-4">
      <div className="flex items-center justify-between gap-3 text-sm text-ink-soft">
        <span>
          Prompt {promptIndex + 1} / 7 · {totalKm} km so far
        </span>
        <span className="badge badge-warn">Placeholder</span>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full bg-[rgba(21,38,46,0.08)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--teal),var(--amber))] transition-[width] duration-500"
          style={{ width: `${((promptIndex + (phase === "feedback" ? 1 : 0)) / 7) * 100}%` }}
        />
      </div>

      <section className="surface animate-rise p-6 sm:p-8">
        {current?.status === "placeholder" ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5b10]">
            Placeholder prompt — not final B4P content
          </p>
        ) : null}
        <h1 className="display text-3xl leading-tight sm:text-4xl">{current?.text}</h1>
        {current?.qualifier ? (
          <p className="mt-3 text-sm text-ink-soft">{current.qualifier}</p>
        ) : null}

        {phase === "countdown" ? (
          <div className="mt-10 flex flex-col items-center gap-3 py-6">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-teal/30" style={{ animation: "pulse-ring 1s ease-out infinite" }} />
              <span className="display text-5xl text-teal-deep">{readLeft}</span>
            </div>
            <p className="text-ink-soft">Read the prompt…</p>
          </div>
        ) : null}

        {phase === "answering" ? (
          <form className="mt-8 space-y-4" onSubmit={(e) => void submitGuess(e)}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className={`display text-4xl ${secondsLeft <= 5 ? "timer-urgent" : "text-teal-deep"}`}>
                  {secondsLeft}s
                </p>
                <p className="text-xs uppercase tracking-[0.12em] text-ink-soft">on the clock</p>
              </div>
            </div>
            <input
              ref={inputRef}
              className="field"
              value={guess}
              onChange={(e) => {
                guessRef.current = e.target.value;
                setGuess(e.target.value);
              }}
              placeholder="Type one answer"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={busy}
            />
            {missMessage ? <p className="text-sm text-[var(--coral-safe)]">{missMessage}</p> : null}
            <button type="submit" className="btn-primary" disabled={busy || !guess.trim()}>
              Ship it
            </button>
          </form>
        ) : null}

        {phase === "feedback" && feedback ? (
          <div className="mt-8 space-y-4">
            <div className="animate-km rounded-2xl bg-[rgba(13,115,119,0.08)] p-5">
              <p className="display text-3xl text-teal-deep">
                {feedback.accepted ? `+${feedback.kmShipped} km` : "0 km"}
              </p>
              <p className="mt-2 text-ink">
                {feedback.accepted
                  ? `${feedback.tierLabel}${feedback.isGem ? " · gem" : ""} — “${feedback.canonical}”`
                  : feedback.message}
              </p>
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => void advanceOrFinish()}
            >
              {promptIndex >= 6 ? "Surface results" : "Next crate"}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
