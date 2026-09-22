"use client";

import {
  ClientState,
  ProfileState,
  Role,
  VendorState,
  type AuthSession,
} from "@eqourse/shared";
import { FrostedSurface } from "@eqourse/ui";
import { useEffect, useState, type ReactNode } from "react";

import { useAuthenticatedSession } from "../authenticated/authenticated-shell";
import {
  firstIncompleteStep,
  formFromDraft,
  incompleteSteps,
  STEPS,
  type StepId,
} from "../company-onboarding/company-onboarding-progress";
import type { CompanyActor } from "../company-onboarding/company-onboarding-config";

type CompanyRecord = Record<string, unknown> & { state: string };
type ProfileRecord = { completionPercentage: number; state: ProfileState };
type ResolvedHome =
  | { kind: "vendor"; record: CompanyRecord }
  | { kind: "client"; record: CompanyRecord }
  | { kind: "specialist"; profile: ProfileRecord };

interface DashboardHomeProps {
  navigate?: (href: string) => void;
}

const vendorStates = new Set<string>(Object.values(VendorState));
const clientStates = new Set<string>(Object.values(ClientState));
const profileStates = new Set<string>(Object.values(ProfileState));
const stepLabels = new Map<StepId, string>(STEPS.map((step) => [step.id, step.label]));

const specialistPending = [
  ["Identity verification", "Your identity-verification status will appear here when that step is available."],
  ["Skill assessments", "Your assigned assessments and results will appear here when assessments are available."],
  ["Available work", "Work matched to your approved profile will appear here when work matching is available."],
  ["Active assignments", "Your current assignments will appear here when assignment delivery is available."],
  ["Quality and feedback", "Reviewed quality feedback will appear here when delivery review is available."],
  ["Earnings", "Your recorded earnings will appear here when the earnings surface is available."],
] as const;

const vendorPending = [
  ["Team", "Invited company members will appear here when team management is available."],
  ["Work orders", "Accepted company work orders will appear here when work orders are available."],
  ["Delivery", "Company delivery activity will appear here when delivery tooling is available."],
  ["Quality", "Reviewed company quality feedback will appear here when delivery review is available."],
  ["Settlement", "Recorded company settlements will appear here when settlement reporting is available."],
] as const;

const clientPending = [
  ["Projects", "Your projects will appear here when project creation is available."],
  ["Assigned talent and teams", "Assigned specialists and delivery teams will appear here when staffing is available."],
  ["Delivery telemetry", "Authoritative delivery progress will appear here when project delivery is available."],
  ["Review queue", "Items awaiting your review will appear here when client review is available."],
  ["Milestones and billing", "Approved milestones and billing records will appear here when billing is available."],
  ["Agreements", "Your company agreements will appear here when agreement management is available."],
] as const;

class ProfileReadError extends Error {}

function defaultNavigate(href: string): void {
  window.location.assign(href);
}

export function DashboardHome({ navigate = defaultNavigate }: DashboardHomeProps) {
  const session = useAuthenticatedSession();
  const [home, setHome] = useState<ResolvedHome | null>(null);
  const [error, setError] = useState<"workspace" | "profile" | null>(null);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      try {
        const [vendor, client] = await Promise.all([
          readOptionalCompany("/api/v1/vendors/me", vendorStates),
          readOptionalCompany("/api/v1/clients/me", clientStates),
        ]);
        if (!active) return;
        if (vendor) {
          setHome({ kind: "vendor", record: vendor });
          return;
        }
        if (client) {
          setHome({ kind: "client", record: client });
          return;
        }

        const internalSurface = internalSurfaceForDashboard(session.roleAssignments);
        if (internalSurface) {
          navigate(internalSurface);
          return;
        }

        const profile = await readProfile();
        if (active) setHome({ kind: "specialist", profile });
      } catch (caught) {
        if (!active) return;
        setError(caught instanceof ProfileReadError ? "profile" : "workspace");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [navigate, session.roleAssignments]);

  if (error === "profile") {
    return <p className="role-home-status" role="alert">We could not load your profile. Refresh and try again.</p>;
  }
  if (error === "workspace") {
    return <p className="role-home-status" role="alert">We could not load your workspace. Refresh and try again.</p>;
  }
  if (!home) return <p className="role-home-status" role="status">Loading your workspace…</p>;
  if (home.kind === "vendor") return <CompanyHome actor="vendor" record={home.record} />;
  if (home.kind === "client") return <CompanyHome actor="client" record={home.record} />;
  return <SpecialistHome profile={home.profile} />;
}

function internalSurfaceForDashboard(
  assignments: AuthSession["roleAssignments"],
): string | undefined {
  return assignments.some((assignment) => assignment.role === Role.VERIFIER)
    ? "/company-reviews"
    : undefined;
}

async function readOptionalCompany(
  path: string,
  allowedStates: ReadonlySet<string>,
): Promise<CompanyRecord | null> {
  const response = await fetch(path, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Company read failed");
  const body: unknown = await response.json();
  if (!isRecord(body) || typeof body.state !== "string" || !allowedStates.has(body.state)) {
    throw new Error("Company response was invalid");
  }
  return { ...body, state: body.state };
}

async function readProfile(): Promise<ProfileRecord> {
  const response = await fetch("/api/v1/profiles/me", { cache: "no-store" });
  if (!response.ok) throw new ProfileReadError("Profile read failed");
  const body: unknown = await response.json();
  if (
    !isRecord(body)
    || typeof body.state !== "string"
    || !profileStates.has(body.state)
    || typeof body.completionPercentage !== "number"
    || !Number.isInteger(body.completionPercentage)
    || body.completionPercentage < 0
    || body.completionPercentage > 100
  ) {
    throw new ProfileReadError("Profile response was invalid");
  }
  return {
    completionPercentage: body.completionPercentage,
    state: body.state as ProfileState,
  };
}

function SpecialistHome({ profile }: { profile: ProfileRecord }) {
  const action = specialistNextAction(profile);
  return (
    <article className="role-home" aria-labelledby="role-home-title">
      <RoleHomeHeader eyebrow="Specialist home" title="Specialist workspace" />
      <div className="role-home-live">
        <Panel title="Next action">{action.copy}<ActionLink action={action} /></Panel>
        <Panel title="Profile">
          <dl className="role-home-facts">
            <Fact label="Completion" value={`${profile.completionPercentage}% complete`} />
            <Fact label="State" value={humanize(profile.state)} />
          </dl>
          <a className="home-registration-link" href="/profile">
            {profile.completionPercentage < 100 ? "Continue profile" : "Edit profile"}
          </a>
        </Panel>
      </div>
      <PendingPanels panels={specialistPending} />
      <aside className="role-home-company-action" aria-label="Company registration">
        <p>Register a vendor or client company when you are ready to operate as an organisation.</p>
        <a className="home-registration-link" href="/register">Register a company</a>
      </aside>
    </article>
  );
}

function CompanyHome({ actor, record }: { actor: CompanyActor; record: CompanyRecord }) {
  const title = actor === "vendor" ? "Vendor workspace" : "Client workspace";
  const pending = actor === "vendor" ? vendorPending : clientPending;
  const action = companyNextAction(actor, record);
  return (
    <article className="role-home" aria-labelledby="role-home-title">
      <RoleHomeHeader eyebrow={`${actor === "vendor" ? "Vendor" : "Client"} home`} title={title} />
      <div className="role-home-live">
        <Panel title="Next action">{action.copy}<ActionLink action={action} /></Panel>
        {actor === "vendor" ? <AccreditationPanel record={record} /> : null}
        <CompanyRecordPanel actor={actor} record={record} />
        {actor === "vendor" ? <CapabilitiesPanel record={record} /> : null}
      </div>
      <PendingPanels panels={pending} />
    </article>
  );
}

function RoleHomeHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="role-home-header">
      <p className="home-eyebrow">{eyebrow}</p>
      <h1 id="role-home-title">{title}</h1>
      <p>Current information from your eQOURSE+ account.</p>
    </header>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  const id = `role-home-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <FrostedSurface className="role-home-panel" variant="panel" role="region" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </FrostedSurface>
  );
}

function AccreditationPanel({ record }: { record: CompanyRecord }) {
  const state = record.state as VendorState;
  const form = formFromDraft(record);
  const outstanding = state === VendorState.DRAFT
    ? incompleteSteps(form, "vendor").map((step) => stepLabels.get(step) ?? step)
    : state === VendorState.MORE_INFO_NEEDED
      ? ["Information requested by compliance"]
      : [];
  return (
    <Panel title="Accreditation">
      <dl className="role-home-facts">
        <Fact label="State" value={humanize(state)} />
        <Fact label="Stage" value={vendorStage(state)} />
      </dl>
      <h3>Outstanding items</h3>
      {outstanding.length > 0
        ? <ul>{outstanding.map((item) => <li key={item}>{item}</li>)}</ul>
        : <p>No registration items are outstanding.</p>}
    </Panel>
  );
}

function CompanyRecordPanel({ actor, record }: { actor: CompanyActor; record: CompanyRecord }) {
  const documents = documentKinds(record);
  const address = isRecord(record.registeredAddress)
    ? formatAddress(record.registeredAddress)
    : undefined;
  return (
    <Panel title={actor === "vendor" ? "Company profile" : "Account"}>
      <dl className="role-home-facts">
        <Fact label="State" value={humanize(record.state)} />
        <Fact label="Legal name" value={stringValue(record.legalName)} />
        <Fact label="Trading name" value={stringValue(record.tradingName)} />
        <Fact label="Country" value={stringValue(record.countryCode)} />
        <Fact label="Registered address" value={address} />
        {actor === "client" ? <Fact label="Website" value={stringValue(record.website)} /> : null}
      </dl>
      <h3>Documents</h3>
      {documents.length > 0
        ? <ul>{documents.map((kind) => <li key={kind}>{humanize(kind)}</li>)}</ul>
        : <p>No documents have been added.</p>}
      <a className="home-registration-link" href={`/register/${actor}`}>
        {isEditable(record.state) ? "Edit company profile" : "View registration"}
      </a>
    </Panel>
  );
}

function CapabilitiesPanel({ record }: { record: CompanyRecord }) {
  const capabilities = Array.isArray(record.capabilities)
    ? record.capabilities.flatMap((entry) => {
        if (!isRecord(entry) || typeof entry.taxonomySlug !== "string") return [];
        return [entry.taxonomySlug];
      })
    : [];
  return (
    <Panel title="Capabilities">
      {capabilities.length > 0
        ? <ul>{capabilities.map((slug) => <li key={slug}>{humanize(slug)}</li>)}</ul>
        : <p>No capabilities have been selected.</p>}
    </Panel>
  );
}

function PendingPanels({ panels }: { panels: readonly (readonly [string, string])[] }) {
  return (
    <section className="role-home-pending" aria-label="Pending features">
      {panels.map(([title, copy]) => (
        <section key={title} className="role-home-empty">
          <h2>{title}</h2>
          <p>{copy}</p>
        </section>
      ))}
    </section>
  );
}

interface NextAction {
  copy: ReactNode;
  href?: string;
  label?: string;
}

function ActionLink({ action }: { action: NextAction }) {
  return action.href && action.label
    ? <a className="home-registration-link" href={action.href}>{action.label}</a>
    : null;
}

function specialistNextAction(profile: ProfileRecord): NextAction {
  if (profile.state === ProfileState.DRAFT && profile.completionPercentage < 100) {
    return {
      copy: <p>Your profile is {profile.completionPercentage}% complete. Continue the saved draft.</p>,
      href: "/profile",
      label: "Continue profile",
    };
  }
  if (profile.state === ProfileState.DRAFT || profile.state === ProfileState.MORE_INFO_NEEDED) {
    return {
      copy: <p>Your profile details can be reviewed and updated.</p>,
      href: "/profile",
      label: "Edit profile",
    };
  }
  const copy: Readonly<Partial<Record<ProfileState, string>>> = {
    [ProfileState.SUBMITTED]: "Your profile has been submitted.",
    [ProfileState.UNDER_REVIEW]: "Your profile is under review.",
    [ProfileState.TEST_PENDING]: "Your profile is waiting for the assessment stage.",
    [ProfileState.TEST_PASSED]: "Your assessment stage is complete.",
    [ProfileState.APPROVED]: "Your profile is approved.",
    [ProfileState.REJECTED]: "Your profile review is complete.",
  };
  return { copy: <p>{copy[profile.state] ?? "Your profile status is available below."}</p> };
}

function companyNextAction(actor: CompanyActor, record: CompanyRecord): NextAction {
  if (record.state === "DRAFT") {
    const step = firstIncompleteStep(formFromDraft(record), actor);
    const label = stepLabels.get(step) ?? "Review";
    return {
      copy: <p>Registration is incomplete. Continue with {label}.</p>,
      href: `/register/${actor}`,
      label: "Continue registration",
    };
  }
  if (record.state === "MORE_INFO_NEEDED") {
    return {
      copy: <p>Your company registration needs more information.</p>,
      href: `/register/${actor}`,
      label: "Update registration",
    };
  }
  const copy: Readonly<Record<string, string>> = {
    SUBMITTED: "Your company registration has been submitted.",
    UNDER_REVIEW: "Your company registration is under review.",
    ACTIVE: "Your vendor accreditation is active.",
    APPROVED: "Your client account is approved.",
    REJECTED: "Your company registration review is complete.",
  };
  return { copy: <p>{copy[record.state] ?? "Your company status is available below."}</p> };
}

function vendorStage(state: VendorState): string {
  if (state === VendorState.DRAFT) return "Company registration";
  if (
    state === VendorState.SUBMITTED
    || state === VendorState.UNDER_REVIEW
    || state === VendorState.MORE_INFO_NEEDED
  ) return "Accreditation review";
  if (state === VendorState.ACTIVE) return "Accredited";
  return "Accreditation decision";
}

function documentKinds(record: CompanyRecord): string[] {
  const documents = Array.isArray(record.documents)
    ? record.documents.flatMap((entry) => isRecord(entry) && typeof entry.kind === "string" ? [entry.kind] : [])
    : [];
  const authorisedPerson = isRecord(record.authorisedPerson) ? record.authorisedPerson : undefined;
  const identity = authorisedPerson && isRecord(authorisedPerson.governmentIdentityDocument)
    ? authorisedPerson.governmentIdentityDocument
    : undefined;
  if (identity && typeof identity.kind === "string") documents.push(identity.kind);
  return documents;
}

function Fact({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function isEditable(state: string): boolean {
  return state === "DRAFT" || state === "MORE_INFO_NEEDED";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function humanize(value: string): string {
  const words = value.toLowerCase().replace(/[-_]+/g, " ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

function formatAddress(address: Record<string, unknown>): string | undefined {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.region,
    address.postalCode,
    address.countryCode,
  ].filter((part): part is string => typeof part === "string" && Boolean(part.trim()));
  return parts.length > 0 ? parts.join(", ") : undefined;
}
