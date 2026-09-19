"use client";

import { FrostedSurface, GlassButton } from "@eqourse/ui";
import { useCallback, useEffect, useMemo, useState } from "react";

type CompanyType = "vendors" | "clients";
type ReviewState = "SUBMITTED" | "UNDER_REVIEW";
type Decision = "START_REVIEW" | "APPROVE" | "REJECT" | "REQUEST_MORE_INFO";

interface QueueItem {
  id: string;
  companyType: CompanyType;
  state: ReviewState;
  submittedAt: string;
}

interface DocumentReference {
  kind: string;
  uploadedAt: string;
}

interface CompanyDetail {
  _id: string;
  state: string;
  legalName?: string;
  tradingName?: string;
  countryCode?: string;
  website?: string;
  registeredAddress?: Record<string, string | undefined>;
  contactPerson?: Record<string, string>;
  authorisedPerson?: {
    name: string;
    governmentIdentityDocument?: DocumentReference;
  };
  capabilities?: Array<{ taxonomySlug: string }>;
  countryIdentifiers?: Array<{ scheme: string; value: string }>;
  bankDetails?: {
    accountHolderName: string;
    bankCountryCode: string;
    currencyCode: string;
    accountIdentifier: { scheme: string; value: string };
    bankIdentifier?: { scheme: string; value: string };
  };
  documents?: DocumentReference[];
  submittedAt?: string;
}

const stateLabels: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  MORE_INFO_NEEDED: "More information needed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function CompanyReviewConsole() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueStatus, setQueueStatus] = useState<"loading" | "ready" | "error" | "forbidden">("loading");
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [detail, setDetail] = useState<CompanyDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [reason, setReason] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [decisionNotice, setDecisionNotice] = useState("");
  const [busyDecision, setBusyDecision] = useState<Decision | null>(null);
  const [documentStatus, setDocumentStatus] = useState<Record<string, string>>({});

  const loadQueue = useCallback(async () => {
    setQueueStatus("loading");
    try {
      const response = await fetch("/api/v1/company-reviews", { cache: "no-store" });
      if (response.status === 403) {
        setQueueStatus("forbidden");
        return;
      }
      if (!response.ok) throw new Error("Queue request failed");
      setQueue((await response.json()) as QueueItem[]);
      setQueueStatus("ready");
    } catch {
      setQueueStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  async function openCase(item: QueueItem) {
    setSelected(item);
    setDetail(null);
    setDetailStatus("loading");
    setReason("");
    setDecisionError("");
    setDecisionNotice("");
    setDocumentStatus({});
    try {
      const response = await fetch(
        `/api/v1/company-reviews/${item.companyType}/${item.id}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("Detail request failed");
      setDetail((await response.json()) as CompanyDetail);
      setDetailStatus("ready");
    } catch {
      setDetailStatus("error");
    }
  }

  async function decide(decision: Decision) {
    if (!selected || !reason.trim() || reason.trim().length > 1_000) return;
    setBusyDecision(decision);
    setDecisionError("");
    setDecisionNotice("");
    try {
      const response = await fetch(
        `/api/v1/company-reviews/${selected.companyType}/${selected.id}/decisions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, reason: reason.trim() }),
        },
      );
      if (!response.ok) {
        const message = await responseMessage(response);
        if (response.status === 400 && /reason|identif|email|phone|country|copy/i.test(message)) {
          setDecisionError(
            "That note looks like it contains identifying information. Remove company values, emails, phone numbers, or reference codes, then try again. Your text has been kept for editing.",
          );
        } else {
          setDecisionError(message || "The decision could not be saved. Review the note and try again.");
        }
        return;
      }
      const updated = (await response.json()) as CompanyDetail;
      setDetail(updated);
      setQueue((items) => updated.state === "UNDER_REVIEW"
        ? items.map((item) => item.id === selected.id ? { ...item, state: "UNDER_REVIEW" } : item)
        : items.filter((item) => item.id !== selected.id));
      setDecisionNotice(decision === "START_REVIEW" ? "This case is now assigned for review." : "Decision recorded in the audit log.");
      setReason("");
    } catch {
      setDecisionError("The decision could not be saved. Your text has been kept; try again.");
    } finally {
      setBusyDecision(null);
    }
  }

  async function viewDocument(kind: string) {
    if (!selected) return;
    setDocumentStatus((current) => ({ ...current, [kind]: "Requesting a secure link…" }));
    try {
      const response = await fetch(
        `/api/v1/company-reviews/${selected.companyType}/${selected.id}/documents/${kind}/url`,
        { cache: "no-store" },
      );
      if (response.status === 404) {
        setDocumentStatus((current) => ({ ...current, [kind]: "Document not found in storage." }));
        return;
      }
      if (!response.ok) throw new Error("Document request failed");
      const signed = (await response.json()) as { url: string; expiresAt: string };
      window.open(signed.url, "_blank", "noopener,noreferrer");
      setDocumentStatus((current) => ({ ...current, [kind]: "Opened with a fresh five-minute link." }));
    } catch {
      setDocumentStatus((current) => ({ ...current, [kind]: "Document storage is temporarily unavailable." }));
    }
  }

  return (
    <section className="company-review-console" aria-labelledby="company-review-title">
      <header className="company-review-header">
        <p className="company-review-eyebrow">Compliance workspace</p>
        <h1 id="company-review-title">Company verification</h1>
        <p>Review submitted client and vendor evidence. Identifying details appear only after you open a case.</p>
      </header>

      <div className="company-review-layout">
        <FrostedSurface className="company-review-queue" variant="panel">
          <div className="company-review-panel-heading">
            <div>
              <p className="company-review-eyebrow">Review queue</p>
              <h2>Submitted companies</h2>
            </div>
            <span className="company-review-count" aria-label={`${queue.length} cases`}>{queue.length}</span>
          </div>
          {queueStatus === "loading" && <p role="status">Loading review queue…</p>}
          {queueStatus === "error" && <RetryMessage message="We could not load the review queue." onRetry={() => void loadQueue()} />}
          {queueStatus === "forbidden" && (
            <p className="company-review-error" role="alert">This workspace is available only to an assigned Verifier.</p>
          )}
          {queueStatus === "ready" && queue.length === 0 && (
            <div className="company-review-empty">
              <span aria-hidden="true">✓</span>
              <p>No companies are waiting for review.</p>
              <GlassButton onClick={() => void loadQueue()}>Refresh queue</GlassButton>
            </div>
          )}
          {queueStatus === "ready" && queue.length > 0 && (
            <ul className="company-review-list" aria-label="Company review queue">
              {queue.map((item) => (
                <li key={`${item.companyType}-${item.id}`}>
                  <button
                    type="button"
                    className={selected?.id === item.id ? "is-selected" : ""}
                    aria-label={`Open ${singular(item.companyType).toLowerCase()} case ${item.id}`}
                    onClick={() => void openCase(item)}
                  >
                    <span className="company-review-list-topline">
                      <strong>{singular(item.companyType)}</strong>
                      <span className={`company-review-state company-review-state--${item.state.toLowerCase()}`}>{stateLabels[item.state]}</span>
                    </span>
                    <code>{item.id}</code>
                    <time dateTime={item.submittedAt}>{formatDate(item.submittedAt)}</time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </FrostedSurface>

        <FrostedSurface className="company-review-detail" variant="panel" glassTier="clear">
          {!selected && (
            <div className="company-review-detail-placeholder">
              <span aria-hidden="true">↗</span>
              <h2>Open a case</h2>
              <p>Select an opaque queue record to reveal its authorised company details.</p>
            </div>
          )}
          {selected && detailStatus === "loading" && <p role="status">Opening secure record…</p>}
          {selected && detailStatus === "error" && (
            <RetryMessage message="This company record could not be opened." onRetry={() => void openCase(selected)} />
          )}
          {selected && detailStatus === "ready" && detail && (
            <CompanyRecord
              companyType={selected.companyType}
              detail={detail}
              reason={reason}
              onReasonChange={setReason}
              onDecide={(decision) => void decide(decision)}
              busyDecision={busyDecision}
              decisionError={decisionError}
              decisionNotice={decisionNotice}
              documentStatus={documentStatus}
              onViewDocument={(kind) => void viewDocument(kind)}
            />
          )}
        </FrostedSurface>
      </div>
    </section>
  );
}

function CompanyRecord({
  companyType,
  detail,
  reason,
  onReasonChange,
  onDecide,
  busyDecision,
  decisionError,
  decisionNotice,
  documentStatus,
  onViewDocument,
}: {
  companyType: CompanyType;
  detail: CompanyDetail;
  reason: string;
  onReasonChange: (value: string) => void;
  onDecide: (decision: Decision) => void;
  busyDecision: Decision | null;
  decisionError: string;
  decisionNotice: string;
  documentStatus: Record<string, string>;
  onViewDocument: (kind: string) => void;
}) {
  const documents = useMemo(() => [
    ...(detail.documents ?? []),
    ...(detail.authorisedPerson?.governmentIdentityDocument
      ? [detail.authorisedPerson.governmentIdentityDocument]
      : []),
  ], [detail]);
  const reasonValid = reason.trim().length >= 1 && reason.trim().length <= 1_000;
  const decisions: Array<{ decision: Decision; label: string; variant?: "primary" | "secondary" | "ghost" }> =
    detail.state === "SUBMITTED"
      ? [{ decision: "START_REVIEW", label: "Pick up this case", variant: "primary" }]
      : detail.state === "UNDER_REVIEW"
        ? [
            ...(companyType === "clients" ? [{ decision: "APPROVE" as const, label: "Approve client", variant: "primary" as const }] : []),
            { decision: "REQUEST_MORE_INFO", label: "Request more information", variant: "secondary" },
            { decision: "REJECT", label: "Reject company", variant: "ghost" },
          ]
        : [];

  return (
    <article className="company-review-record">
      <header className="company-review-record-header">
        <div>
          <p className="company-review-eyebrow">{singular(companyType)} · {stateLabels[detail.state] ?? detail.state}</p>
          <h2>{detail.legalName ?? "Unnamed company"}</h2>
          {detail.tradingName && <p>Trading as {detail.tradingName}</p>}
        </div>
        <code>{detail._id}</code>
      </header>

      <section className="company-review-facts" aria-labelledby="company-overview-heading">
        <h3 id="company-overview-heading">Company record</h3>
        <dl>
          <Fact label="Country" value={detail.countryCode} />
          <Fact label="Submitted" value={detail.submittedAt ? formatDate(detail.submittedAt) : undefined} />
          <Fact label="Website" value={detail.website} />
          {detail.contactPerson && <Fact label="Contact" value={`${detail.contactPerson.name} · ${detail.contactPerson.email} · ${detail.contactPerson.phone}`} />}
          {detail.authorisedPerson && <Fact label="Authorised person" value={detail.authorisedPerson.name} />}
          {detail.registeredAddress && <Fact label="Registered address" value={formatAddress(detail.registeredAddress)} />}
        </dl>
      </section>

      {(detail.countryIdentifiers?.length ?? 0) > 0 && (
        <RecordSection title="Registered identifiers">
          <dl>{detail.countryIdentifiers?.map((identifier) => <Fact key={identifier.scheme} label={humanize(identifier.scheme)} value={identifier.value} />)}</dl>
        </RecordSection>
      )}

      {(detail.capabilities?.length ?? 0) > 0 && (
        <RecordSection title="Capabilities">
          <ul>{detail.capabilities?.map(({ taxonomySlug }) => <li key={taxonomySlug}>{humanize(taxonomySlug)}</li>)}</ul>
        </RecordSection>
      )}

      {detail.bankDetails && (
        <RecordSection title="Bank details">
          <dl>
            <Fact label="Account holder" value={detail.bankDetails.accountHolderName} />
            <Fact label="Bank country" value={detail.bankDetails.bankCountryCode} />
            <Fact label="Currency" value={detail.bankDetails.currencyCode} />
            <Fact label={humanize(detail.bankDetails.accountIdentifier.scheme)} value={detail.bankDetails.accountIdentifier.value} />
            {detail.bankDetails.bankIdentifier && <Fact label={humanize(detail.bankDetails.bankIdentifier.scheme)} value={detail.bankDetails.bankIdentifier.value} />}
          </dl>
        </RecordSection>
      )}

      <RecordSection title="Documents">
        {documents.length === 0 ? <p>No document references were supplied.</p> : (
          <ul className="company-review-documents">
            {documents.map((document, index) => (
              <li key={`${document.kind}-${index}`}>
                <div>
                  <strong>{humanize(document.kind)}</strong>
                  <span>Uploaded {formatDate(document.uploadedAt)}</span>
                </div>
                <GlassButton onClick={() => onViewDocument(document.kind)}>View {humanize(document.kind).toLowerCase()}</GlassButton>
                {documentStatus[document.kind] && <p role="status">{documentStatus[document.kind]}</p>}
              </li>
            ))}
          </ul>
        )}
      </RecordSection>

      {decisions.length > 0 && (
        <section className="company-review-decision" aria-labelledby="decision-heading">
          <p className="company-review-eyebrow">Audited action</p>
          <h3 id="decision-heading">Record a decision</h3>
          <label htmlFor="company-review-reason">Decision reason</label>
          <textarea
            id="company-review-reason"
            value={reason}
            maxLength={1_000}
            rows={4}
            onChange={(event) => onReasonChange(event.target.value)}
            aria-describedby="company-review-reason-help company-review-reason-count"
          />
          <div className="company-review-reason-meta">
            <p id="company-review-reason-help">Write a short audit note without names, emails, phone numbers, identifiers or reference codes.</p>
            <span id="company-review-reason-count">{reason.length}/1000</span>
          </div>
          {decisionError && <p className="company-review-error" role="alert">{decisionError}</p>}
          {decisionNotice && <p className="company-review-notice" role="status">{decisionNotice}</p>}
          <div className="company-review-decision-actions">
            {decisions.map(({ decision, label, variant }) => (
              <GlassButton
                key={decision}
                variant={variant}
                disabled={!reasonValid || busyDecision !== null}
                onClick={() => onDecide(decision)}
              >
                {busyDecision === decision ? "Saving…" : label}
              </GlassButton>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function RecordSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="company-review-facts"><h3>{title}</h3>{children}</section>;
}

function Fact({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function RetryMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="company-review-retry" role="alert">
      <p>{message}</p>
      <GlassButton onClick={onRetry}>Try again</GlassButton>
    </div>
  );
}

async function responseMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "";
  } catch {
    return "";
  }
}

function singular(type: CompanyType): "Vendor" | "Client" {
  return type === "vendors" ? "Vendor" : "Client";
}

function humanize(value: string): string {
  const words = value.replace(/[-_]+/g, " ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

function formatDate(value: string): string {
  return dateFormat.format(new Date(value));
}

function formatAddress(address: Record<string, string | undefined>): string {
  return [address.line1, address.line2, address.city, address.region, address.postalCode, address.countryCode]
    .filter(Boolean)
    .join(", ");
}
