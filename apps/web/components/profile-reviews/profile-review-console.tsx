"use client";

import { FrostedSurface, GlassButton } from "@eqourse/ui";
import { useCallback, useEffect, useState } from "react";

type ProfileState = "SUBMITTED" | "UNDER_REVIEW" | "TEST_PENDING" | "REJECTED" | "MORE_INFO_NEEDED";
type Decision = "START_REVIEW" | "APPROVE" | "REJECT" | "REQUEST_MORE_INFO";

interface QueueItem {
  id: string;
  state: ProfileState;
  submittedAt: string;
}

interface ProfileDetail extends Omit<QueueItem, "id"> {
  _id?: string;
  personal?: { firstName?: string; lastName?: string; headline?: string; city?: string };
  education?: Array<Record<string, unknown>>;
  skills?: Array<Record<string, unknown>>;
  languages?: Array<Record<string, unknown>>;
  experience?: Record<string, unknown>;
  samples?: Array<{ title?: string; objectKey?: string; uploadedAt?: string }>;
  availability?: Record<string, unknown>;
  rate?: Record<string, unknown>;
}

const labels: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  TEST_PENDING: "Approved for testing",
  REJECTED: "Rejected",
  MORE_INFO_NEEDED: "More information needed",
};

export function ProfileReviewConsole() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [detail, setDetail] = useState<ProfileDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "forbidden">("loading");
  const [detailStatus, setDetailStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Decision | null>(null);

  const loadQueue = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/v1/profiles/reviews", { cache: "no-store" });
      if (response.status === 403) return setStatus("forbidden");
      if (!response.ok) throw new Error();
      setQueue((await response.json()) as QueueItem[]);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { void loadQueue(); }, [loadQueue]);

  async function openProfile(item: QueueItem) {
    setSelected(item);
    setDetail(null);
    setDetailStatus("loading");
    setReason("");
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/v1/profiles/reviews/${item.id}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      setDetail((await response.json()) as ProfileDetail);
      setDetailStatus("ready");
    } catch {
      setDetailStatus("error");
    }
  }

  async function decide(decision: Decision) {
    if (!selected || !reason.trim() || reason.trim().length > 1_000) return;
    setBusy(decision);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/v1/profiles/reviews/${selected.id}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: reason.trim() }),
      });
      if (!response.ok) throw new Error(await response.text());
      const updated = (await response.json()) as ProfileDetail;
      setDetail(updated);
      setQueue((items) => updated.state === "UNDER_REVIEW" ? items.map((item) => item.id === selected.id ? updated : item) : items.filter((item) => item.id !== selected.id));
      setReason("");
      setNotice(`Status updated: ${labels[updated.state]}`);
    } catch {
      setError("The decision could not be saved. Your reason has been kept.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="company-review-console" aria-labelledby="profile-review-title">
      <header>
        <p>Verification workspace</p>
        <h1 id="profile-review-title">Freelancer profile review</h1>
        <p>Open a submitted profile, review its application data, and record the next state with an audit reason.</p>
      </header>
      <div className="company-review-layout">
        <FrostedSurface className="company-review-queue" variant="panel">
          <h2>Pending profiles</h2>
          {status === "loading" && <p role="status">Loading profiles…</p>}
          {status === "error" && <p role="alert">We could not load the review queue.</p>}
          {status === "forbidden" && <p role="alert">This workspace is available only to an assigned Verifier.</p>}
          {status === "ready" && queue.length === 0 && <p>No freelancer profiles are waiting for review.</p>}
          {status === "ready" && queue.length > 0 && (
            <ul aria-label="Freelancer profile review queue">
              {queue.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => void openProfile(item)} aria-label={`Open freelancer profile ${item.id}`}>
                    <strong>{labels[item.state]}</strong> <code>{item.id}</code>
                    <time dateTime={item.submittedAt}>{new Date(item.submittedAt).toLocaleString("en-GB")}</time>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {status === "ready" && <GlassButton onClick={() => void loadQueue()}>Refresh queue</GlassButton>}
        </FrostedSurface>
        <FrostedSurface className="company-review-detail" variant="panel">
          {!selected && <p>Select a profile to inspect its submitted data.</p>}
          {selected && detailStatus === "loading" && <p role="status">Opening profile…</p>}
          {selected && detailStatus === "error" && <p role="alert">This profile could not be opened.</p>}
          {detailStatus === "ready" && detail && (
            <article>
              <p>{labels[detail.state]}</p>
              <h2>{[detail.personal?.firstName, detail.personal?.lastName].filter(Boolean).join(" ") || "Freelancer profile"}</h2>
              <dl>
                <dt>Headline</dt><dd>{detail.personal?.headline || "Not supplied"}</dd>
                <dt>City</dt><dd>{detail.personal?.city || "Not supplied"}</dd>
                <dt>Education</dt><dd>{detail.education?.length ?? 0} entries</dd>
                <dt>Skills</dt><dd>{detail.skills?.length ?? 0} selected</dd>
                <dt>Languages</dt><dd>{detail.languages?.length ?? 0} supplied</dd>
                <dt>Experience</dt><dd>{String(detail.experience?.totalMonths ?? 0)} months</dd>
                <dt>Samples</dt><dd>{detail.samples?.length ?? 0} uploaded</dd>
                <dt>Availability</dt><dd>{String(detail.availability?.weeklyHours ?? "Not supplied")} hours/week</dd>
                <dt>Rate</dt><dd>{detail.rate ? `${String(detail.rate.amountMinor)} ${String(detail.rate.currencyCode)} / ${String(detail.rate.unit)}` : "Not supplied"}</dd>
              </dl>
              {detail.state === "SUBMITTED" || detail.state === "UNDER_REVIEW" ? (
                <section aria-labelledby="profile-decision-title">
                  <h3 id="profile-decision-title">Record a decision</h3>
                  <label htmlFor="profile-review-reason">Reason</label>
                  <textarea id="profile-review-reason" value={reason} maxLength={1_000} onChange={(event) => setReason(event.target.value)} />
                  <p>Use a concise note without names, emails, phone numbers, or identifiers.</p>
                  {error && <p role="alert">{error}</p>}
                  {notice && <p role="status">{notice}</p>}
                  {detail.state === "SUBMITTED" && <GlassButton disabled={!reason.trim() || busy !== null} onClick={() => void decide("START_REVIEW")}>Start review</GlassButton>}
                  {detail.state === "UNDER_REVIEW" && <>
                    <GlassButton disabled={!reason.trim() || busy !== null} onClick={() => void decide("APPROVE")}>Approve for testing</GlassButton>
                    <GlassButton disabled={!reason.trim() || busy !== null} onClick={() => void decide("REQUEST_MORE_INFO")}>Request more information</GlassButton>
                    <GlassButton disabled={!reason.trim() || busy !== null} onClick={() => void decide("REJECT")}>Reject</GlassButton>
                  </>}
                </section>
              ) : null}
            </article>
          )}
        </FrostedSurface>
      </div>
    </section>
  );
}
