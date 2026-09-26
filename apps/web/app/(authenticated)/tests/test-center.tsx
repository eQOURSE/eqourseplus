"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function Icon({ kind, className = "" }: { kind: "arrow" | "check" | "clock" | "expand" | "shield"; className?: string }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 5 5L20 7" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    expand: <><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" /></>,
    shield: <><path d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5l-8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[kind]}</svg>;
}

interface Category {
  taxonomySlug: string;
  title: string;
  serviceLine: string;
  questionCount: number;
  timeLimitSeconds: number;
  eligibility: { remainingAttempts: number; cooldownExpiry: string | null; canStart: boolean };
}
interface Item { questionId: string; prompt: string; options: Array<{ id: string; text: string }> }
interface Attempt {
  id: string;
  taxonomySlug: string;
  status: "IN_PROGRESS" | "PASSED" | "FAILED" | "UNDER_REVIEW" | "EXPIRED";
  expiresAt: string;
  serverNow: string;
  items: Item[];
  scorePercent?: number;
  tier?: string;
  violations: Array<{ kind: string; occurredAt: string }>;
}

function progressKey(id: string): string { return `assessment-progress:${id}`; }

function restoreProgress(saved: Attempt): { position: number; answers: Record<string, string> } {
  try {
    const raw = window.sessionStorage.getItem(progressKey(saved.id));
    if (!raw) return { position: 0, answers: {} };
    const parsed = JSON.parse(raw) as { position?: unknown; answers?: unknown };
    const position = typeof parsed.position === "number" && Number.isInteger(parsed.position)
      ? Math.max(0, Math.min(parsed.position, saved.items.length - 1)) : 0;
    const answers: Record<string, string> = {};
    if (parsed.answers && typeof parsed.answers === "object") {
      for (const item of saved.items.slice(0, position + 1)) {
        const choice = (parsed.answers as Record<string, unknown>)[item.questionId];
        if (typeof choice === "string" && item.options.some((option) => option.id === choice)) answers[item.questionId] = choice;
      }
    }
    return { position, answers };
  } catch { return { position: 0, answers: {} }; }
}

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  if (!response.ok) throw new Error(response.status === 401 ? "Sign in to open your test center." : "The test service is unavailable. Please try again.");
  return response.json() as Promise<T>;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  return `${String(minutes).padStart(2, "0")}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;
}

export function TestCenter() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [integrityNotice, setIntegrityNotice] = useState("");
  const [fullScreenRequired, setFullScreenRequired] = useState(false);
  const deadline = useRef(0);
  const pendingViolations = useRef<Array<Promise<unknown>>>([]);
  const integrityDeliveryFailed = useRef(false);
  const attemptRef = useRef<Attempt | null>(null);
  attemptRef.current = attempt;

  const loadCatalog = useCallback(async () => {
    try {
      setCategories(await readJson<Category[]>("/api/tests/catalog"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load tests.");
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
    const id = new URLSearchParams(window.location.search).get("attempt");
    if (id && /^[a-f\d]{24}$/i.test(id)) {
      void readJson<Attempt>(`/api/tests/attempts/${id}`).then((saved) => {
        if (saved.status === "IN_PROGRESS") {
          const progress = restoreProgress(saved);
          setPosition(progress.position);
          setAnswers(progress.answers);
        }
        setAttempt(saved);
        setFullScreenRequired(saved.status === "IN_PROGRESS");
      }).catch(() => {
        window.history.replaceState({}, "", "/tests");
      });
    }
  }, [loadCatalog]);

  useEffect(() => {
    if (!attempt || attempt.status !== "IN_PROGRESS") return;
    deadline.current = Date.now() + Math.max(0, new Date(attempt.expiresAt).getTime() - new Date(attempt.serverNow).getTime());
    const tick = () => setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [attempt]);

  useEffect(() => {
    if (!attempt || attempt.status !== "IN_PROGRESS" || remaining > 0 ||
      !deadline.current || Date.now() < deadline.current) return;
    void readJson<Attempt>(`/api/tests/attempts/${attempt.id}`).then(setAttempt).catch(() => {
      setError("Time is up. Refresh to see the recorded attempt status.");
    });
  }, [attempt, remaining]);

  useEffect(() => {
    if (!attempt || attempt.status !== "IN_PROGRESS") return;
    const record = (kind: "FULLSCREEN_EXIT" | "TAB_SWITCH" | "WINDOW_BLUR") => {
      const current = attemptRef.current;
      if (!current || current.status !== "IN_PROGRESS") return;
      const pending = fetch(`/api/tests/attempts/${current.id}/violations`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }),
        keepalive: true,
      }).then((response) => {
        if (!response.ok) throw new Error("Integrity event could not be recorded.");
        integrityDeliveryFailed.current = false;
        setIntegrityNotice("An integrity event was recorded. Your result will need verifier review.");
      }).catch(() => {
        integrityDeliveryFailed.current = true;
        setError("An integrity event could not be recorded. Please retry before submitting.");
      });
      pendingViolations.current.push(pending);
    };
    const fullscreen = () => {
      setFullScreenRequired(!document.fullscreenElement);
      if (!document.fullscreenElement) record("FULLSCREEN_EXIT");
    };
    const visibility = () => { if (document.hidden) record("TAB_SWITCH"); };
    const blur = () => record("WINDOW_BLUR");
    document.addEventListener("fullscreenchange", fullscreen);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    return () => {
      document.removeEventListener("fullscreenchange", fullscreen);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
    };
  }, [attempt]);

  async function start(category: Category) {
    setBusy(true);
    setError("");
    try {
      if (!document.documentElement.requestFullscreen) throw new Error("Full-screen mode is required for this test.");
      await document.documentElement.requestFullscreen();
      const next = await readJson<Attempt>(`/api/tests/${category.taxonomySlug}/attempts`, { method: "POST" });
      setAttempt(next);
      integrityDeliveryFailed.current = false;
      pendingViolations.current = [];
      setFullScreenRequired(false);
      setPosition(0);
      setAnswers({});
      window.sessionStorage.setItem(progressKey(next.id), JSON.stringify({ position: 0, answers: {} }));
      window.history.replaceState({}, "", `/tests?attempt=${next.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the test.");
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
    } finally { setBusy(false); }
  }

  async function submit() {
    if (!attempt) return;
    setBusy(true);
    setError("");
    try {
      await Promise.allSettled(pendingViolations.current);
      pendingViolations.current = [];
      if (integrityDeliveryFailed.current) throw new Error("An integrity event could not be recorded. Re-enter full-screen and try again.");
      const result = await readJson<Attempt>(`/api/tests/attempts/${attempt.id}/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })) }),
      });
      attemptRef.current = result;
      setAttempt(result);
      window.sessionStorage.removeItem(progressKey(attempt.id));
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      window.history.replaceState({}, "", "/tests");
      void loadCatalog();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not submit your test."); }
    finally { setBusy(false); }
  }

  const item = attempt?.items[position];
  const active = attempt?.status === "IN_PROGRESS";

  async function reenterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
      setFullScreenRequired(false);
    } catch { setError("Full-screen mode is required to continue."); }
  }

  function choose(questionId: string, optionId: string) {
    const next = { ...answers, [questionId]: optionId };
    setAnswers(next);
    if (attempt) window.sessionStorage.setItem(progressKey(attempt.id), JSON.stringify({ position, answers: next }));
  }

  function advance() {
    if (!attempt || position >= attempt.items.length - 1) return;
    const next = position + 1;
    setPosition(next);
    window.sessionStorage.setItem(progressKey(attempt.id), JSON.stringify({ position: next, answers }));
  }

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card/80 px-5 py-4 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="font-heading text-xl font-extrabold tracking-tight">eQOURSE<span className="text-primary">+</span> <span className="ml-3 border-l border-border pl-3 text-sm font-semibold text-muted-foreground">Test Center</span></div>
        {active && <div className="flex items-center gap-2 font-mono text-lg font-semibold tabular-nums" aria-live="off"><Icon kind="clock" className="h-5 w-5 text-primary" />{formatDuration(remaining)}</div>}
      </div>
    </header>
    <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-14">
      {error && <div role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">{error}</div>}
      {active && fullScreenRequired ? <section className="max-w-xl border-t border-border pt-10"><Icon kind="expand" className="mb-5 h-12 w-12 text-primary" /><h1 className="mb-3 font-heading text-3xl font-bold">Return to full-screen mode</h1><p className="mb-7 text-muted-foreground">The server timer continues while the test is open. Re-enter full-screen to continue.</p><button type="button" onClick={() => void reenterFullscreen()} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground">Enter full-screen</button></section> : active && item ? <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section aria-labelledby="question-title">
          <div className="mb-5 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground"><span>Question {position + 1} of {attempt.items.length}</span><span>{Math.round(((position + 1) / attempt.items.length) * 100)}% through</span></div>
          <div className="mb-10 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${((position + 1) / attempt.items.length) * 100}%` }} /></div>
          <h1 id="question-title" className="mb-9 max-w-3xl font-heading text-2xl font-bold leading-snug sm:text-3xl">{item.prompt}</h1>
          <fieldset className="space-y-3"><legend className="sr-only">Choose one answer</legend>{item.options.map((option) => <label key={option.id} className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-lg border px-5 py-4 transition-colors motion-reduce:transition-none ${answers[item.questionId] === option.id ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/50"}`}>
            <input type="radio" name={item.questionId} value={option.id} checked={answers[item.questionId] === option.id} onChange={() => choose(item.questionId, option.id)} className="h-4 w-4 accent-primary" />
            <span className="text-sm font-medium sm:text-base">{option.text}</span>
          </label>)}</fieldset>
          <div className="mt-9 flex justify-end"><button type="button" disabled={busy || remaining === 0 || !answers[item.questionId]} onClick={() => position < attempt.items.length - 1 ? advance() : void submit()} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none">{position < attempt.items.length - 1 ? "Next question" : "Submit test"}<Icon kind="arrow" className="h-4 w-4" /></button></div>
        </section>
        <aside className="space-y-6 text-sm text-muted-foreground"><div className="border-l-2 border-primary pl-4"><p className="mb-1 font-semibold text-foreground">One direction</p><p>Answers can be changed until you move to the next question. You cannot go back.</p></div><div className="border-l-2 border-border pl-4"><p className="mb-1 font-semibold text-foreground">Integrity checks</p><p>Stay in full-screen mode and keep this tab in focus. Events are included in your attempt report.</p></div>{integrityNotice && <p role="status" className="rounded-lg bg-secondary p-4 text-foreground">{integrityNotice}</p>}{remaining === 0 && <p role="alert" className="rounded-lg bg-destructive/10 p-4 text-foreground">Time is up. The server will reject late answers.</p>}</aside>
      </div> : attempt && attempt.status !== "IN_PROGRESS" ? <section className="max-w-2xl"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-secondary text-primary"><Icon kind="check" className="h-7 w-7" /></div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Attempt complete</p><h1 className="mb-4 font-heading text-4xl font-bold">{attempt.status === "PASSED" ? "Test passed" : attempt.status === "UNDER_REVIEW" ? "Under review" : attempt.status === "EXPIRED" ? "Time expired" : "Test not passed"}</h1><p className="mb-8 text-muted-foreground">{attempt.status === "UNDER_REVIEW" ? "A verifier will review the integrity events before the result is final." : attempt.status === "PASSED" ? `Your score is ${attempt.scorePercent}%. ${attempt.tier} tier has been awarded.` : `Score: ${attempt.scorePercent ?? 0}%. Check your next eligible date in the test center.`}</p><button onClick={() => { setAttempt(null); window.history.replaceState({}, "", "/tests"); }} className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Back to test center</button></section> : <section>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Skills assessment</p><h1 className="font-heading text-3xl font-bold sm:text-4xl">Available tests</h1><p className="mt-3 text-muted-foreground">Choose a category to see your eligibility and start a timed assessment.</p></div><Icon kind="shield" className="h-10 w-10 text-primary" /></div>
        {categories === null ? <p role="status" className="text-muted-foreground">Loading tests…</p> : categories.length === 0 ? <div className="max-w-lg border-t border-border py-12"><Icon kind="expand" className="mb-6 h-12 w-12 text-primary" /><p className="mb-5 text-muted-foreground">No approved category test is available yet.</p><button onClick={() => void loadCatalog()} className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Check again</button></div> : <div className="divide-y divide-border border-y border-border">{categories.map((category) => <article key={category.taxonomySlug} className="grid gap-5 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">{category.serviceLine}</p><h2 className="font-heading text-xl font-bold">{category.title}</h2><p className="mt-2 text-sm text-muted-foreground">{category.questionCount} questions · {Math.ceil(category.timeLimitSeconds / 60)} minutes · {category.eligibility.remainingAttempts} {category.eligibility.remainingAttempts === 1 ? "attempt" : "attempts"} remaining</p>{category.eligibility.cooldownExpiry && !category.eligibility.canStart && category.eligibility.remainingAttempts > 0 && <p className="mt-2 text-sm text-muted-foreground">Available after {new Date(category.eligibility.cooldownExpiry).toLocaleDateString()}</p>}</div><button type="button" disabled={!category.eligibility.canStart || busy} onClick={() => void start(category)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground">Start test<Icon kind="arrow" className="h-4 w-4" /></button></article>)}</div>}
      </section>}
    </div>
  </div>;
}
