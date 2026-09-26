"use client";

import { useEffect, useState } from "react";

function ReviewIcon({ alert = false, className = "" }: { alert?: boolean; className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{alert ? <><path d="M12 3 2 21h20L12 3Z" /><path d="M12 9v5m0 3h.01" /></> : <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M8 12l2 2 5-5" /></>}</svg>;
}

interface QueueItem {
  id: string; userId: string; taxonomySlug: string; startedAt: string;
  scorePercent: number; violationCount: number;
}
interface Report {
  id: string; taxonomySlug: string; status: string; startedAt: string;
  scorePercent: number; tier?: string;
  violations: Array<{ kind: string; occurredAt: string }>;
}

export function VerifierTests() {
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/tests/review-queue", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Unable to load assessment reviews.");
      return response.json() as Promise<QueueItem[]>;
    }).then(setQueue).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Unable to load reviews."));
  }, []);

  async function openReport(id: string) {
    setError("");
    try {
      const response = await fetch(`/api/tests/attempts/${id}/report`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load the attempt report.");
      setReport(await response.json() as Report);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load report."); }
  }

  return <div className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="mb-10 border-b border-border pb-7"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Verifier console</p><h1 className="font-heading text-3xl font-bold">Assessment review</h1><p className="mt-2 text-sm text-muted-foreground">Flagged attempts stay under review. No badge is issued while flags remain open.</p></div>
      {error && <p role="alert" className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm">{error}</p>}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <section aria-label="Review queue"><div className="mb-4 flex items-center justify-between"><h2 className="font-heading text-lg font-semibold">Open flags</h2><span className="text-sm text-muted-foreground">{queue?.length ?? 0} attempts</span></div>
          {queue === null ? <p className="text-sm text-muted-foreground">Loading reviews…</p> : queue.length === 0 ? <div className="border-t border-border py-12"><ReviewIcon className="mb-5 h-12 w-12 text-primary" /><p className="mb-5 text-muted-foreground">No flagged attempts are waiting for review.</p><button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Refresh queue</button></div> : <div className="divide-y divide-border border-y border-border">{queue.map((item) => <button key={item.id} type="button" onClick={() => void openReport(item.id)} className="flex w-full flex-col gap-2 py-5 text-left hover:bg-secondary/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><span className="text-xs font-semibold uppercase tracking-wider text-primary">{item.taxonomySlug.replaceAll("-", " ")}</span><span className="font-medium">Candidate {item.userId.slice(-6)} · {item.scorePercent}% score</span><span className="flex items-center gap-2 text-sm text-muted-foreground"><ReviewIcon alert className="h-4 w-4" />{item.violationCount} integrity {item.violationCount === 1 ? "event" : "events"} · {new Date(item.startedAt).toLocaleString()}</span></button>)}</div>}
        </section>
        <aside aria-label="Attempt report" className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><h2 className="mb-5 font-heading text-lg font-semibold">Attempt report</h2>{report ? <div className="space-y-6 text-sm"><div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</p><p className="font-semibold">{report.status.replaceAll("_", " ")}</p></div><div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Score</p><p className="font-semibold">{report.scorePercent}% {report.tier ? `· provisional ${report.tier}` : ""}</p></div><div><p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Integrity events</p><ul className="space-y-3">{report.violations.map((event, index) => <li key={`${event.kind}-${index}`} className="border-l-2 border-destructive pl-3"><span className="block font-medium">{event.kind.replaceAll("_", " ")}</span><span className="text-muted-foreground">{new Date(event.occurredAt).toLocaleString()}</span></li>)}</ul></div></div> : <p className="text-sm text-muted-foreground">Select an attempt to inspect its score and integrity events.</p>}</aside>
      </div>
    </div>
  </div>;
}
