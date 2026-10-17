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
      setQueue((items) => updated.state === "UNDER_REVIEW"
        ? items.map((item) => item.id === selected.id
          ? { ...item, state: updated.state, submittedAt: updated.submittedAt ?? item.submittedAt }
          : item)
        : items.filter((item) => item.id !== selected.id));
      setReason("");
      setNotice(`Status updated: ${labels[updated.state]}`);
    } catch {
      setError("The decision could not be saved. Your reason has been kept.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="profile-review-console" aria-labelledby="profile-review-title">
      <header className="profile-review-heading">
        <p className="profile-refresh-kicker">Verification / freelancer profiles</p>
        <h1 id="profile-review-title">Freelancer profile review</h1>
        <p>Review submitted profiles and record each decision with an audit reason.</p>
      </header>
      <div className="profile-review-layout">
        <FrostedSurface className="profile-review-queue" variant="panel">
          <div className="profile-review-panel-heading">
            <div>
              <p className="profile-refresh-kicker">Queue</p>
              <h2>Pending profiles</h2>
            </div>
            {status === "ready" && <span className="profile-review-count" aria-label={`${queue.length} pending profiles`}>{queue.length}</span>}
          </div>
          {status === "loading" && <p role="status">Loading profiles…</p>}
          {status === "error" && <p className="profile-review-alert" role="alert">We could not load the review queue.</p>}
          {status === "forbidden" && <p className="profile-review-alert" role="alert">This workspace is available only to an assigned Verifier.</p>}
          {status === "ready" && queue.length === 0 && <div className="profile-review-empty"><span aria-hidden="true">◇</span><p>No freelancer profiles are waiting for review.</p><GlassButton onClick={() => void loadQueue()}>Refresh queue</GlassButton></div>}
          {status === "ready" && queue.length > 0 && (
            <ul className="profile-review-list" aria-label="Freelancer profile review queue">
              {queue.map((item) => (
                <li key={item.id}>
                  <button type="button" className={selected?.id === item.id ? "is-selected" : undefined} onClick={() => void openProfile(item)} aria-label={`Open freelancer profile ${item.id}`}>
                    <span className="profile-review-list-top"><strong>{labels[item.state]}</strong><span aria-hidden="true">↗</span></span>
                    <code>{item.id}</code>
                    <time dateTime={item.submittedAt}>{new Date(item.submittedAt).toLocaleString("en-GB")}</time>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {status === "ready" && queue.length > 0 && <GlassButton onClick={() => void loadQueue()}>Refresh queue</GlassButton>}
        </FrostedSurface>
        <FrostedSurface className="profile-review-detail" variant="panel">
          {!selected && <div className="profile-review-empty"><span aria-hidden="true">↗</span><h2>Profile details</h2><p>Select a profile to inspect its submitted data.</p></div>}
          {selected && detailStatus === "loading" && <p role="status">Opening profile…</p>}
          {selected && detailStatus === "error" && <p className="profile-review-alert" role="alert">This profile could not be opened.</p>}
          {detailStatus === "ready" && detail && (
            <article className="profile-review-record">
              <header className="profile-review-record-heading">
                <p className="profile-refresh-kicker">{labels[detail.state]}</p>
                <h2>{[detail.personal?.firstName, detail.personal?.lastName].filter(Boolean).join(" ") || "Freelancer profile"}</h2>
              </header>
              <dl className="profile-review-facts">
                <div><dt>Headline</dt><dd>{detail.personal?.headline || "Not supplied"}</dd></div>
                <div><dt>City</dt><dd>{detail.personal?.city || "Not supplied"}</dd></div>
                <div><dt>Education</dt><dd>{detail.education?.length ?? 0} entries</dd></div>
                <div><dt>Skills</dt><dd>{detail.skills?.length ?? 0} selected</dd></div>
                <div><dt>Languages</dt><dd>{detail.languages?.length ?? 0} supplied</dd></div>
                <div><dt>Experience</dt><dd>{String(detail.experience?.totalMonths ?? 0)} months</dd></div>
                <div><dt>Samples</dt><dd>{detail.samples?.length ?? 0} uploaded</dd></div>
                <div><dt>Availability</dt><dd>{String(detail.availability?.weeklyHours ?? "Not supplied")} hours/week</dd></div>
                <div><dt>Rate</dt><dd>{detail.rate ? `${String(detail.rate.amountMinor)} ${String(detail.rate.currencyCode)} / ${String(detail.rate.unit)}` : "Not supplied"}</dd></div>
              </dl>
              {detail.state === "SUBMITTED" || detail.state === "UNDER_REVIEW" ? (
                <section className="profile-review-decision" aria-labelledby="profile-decision-title">
                  <h3 id="profile-decision-title">Record a decision</h3>
                  <label htmlFor="profile-review-reason">Reason</label>
                  <textarea id="profile-review-reason" value={reason} maxLength={1_000} onChange={(event) => setReason(event.target.value)} />
                  <p>Use a concise note without names, emails, phone numbers, or identifiers.</p>
                  {error && <p className="profile-review-alert" role="alert">{error}</p>}
                  {notice && <p className="profile-review-notice" role="status">{notice}</p>}
                  <div className="profile-review-actions">
                    {detail.state === "SUBMITTED" && <GlassButton disabled={!reason.trim() || busy !== null} onClick={() => void decide("START_REVIEW")}>Start review</GlassButton>}
                    {detail.state === "UNDER_REVIEW" && <>
                    <GlassButton disabled={!reason.trim() || busy !== null} onClick={() => void decide("APPROVE")}>Approve for testing</GlassButton>
                    <GlassButton disabled={!reason.trim() || busy !== null} onClick={() => void decide("REQUEST_MORE_INFO")}>Request more information</GlassButton>
                    <GlassButton disabled={!reason.trim() || busy !== null} onClick={() => void decide("REJECT")}>Reject</GlassButton>
                    </>}
                  </div>
                </section>
              ) : null}
            </article>
          )}
        </FrostedSurface>
      </div>
    </section>
  );
}
