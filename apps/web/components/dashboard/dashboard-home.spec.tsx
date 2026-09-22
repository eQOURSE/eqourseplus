import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthenticatedShell } from "../authenticated/authenticated-shell";
import { DashboardHome } from "./dashboard-home";

const fetchMock = vi.fn<typeof fetch>();

const specialistSession = {
  userId: "user-1",
  email: "specialist@example.com",
  roleAssignments: [],
  profileState: "DRAFT" as const,
};

const verifierSession = {
  ...specialistSession,
  email: "verifier@example.com",
  roleAssignments: [{ role: "VERIFIER" as const, businessUnit: "EQOURSE" as const }],
};

const completeCompany = {
  legalName: "Rhein Data GmbH",
  tradingName: "Rhein Data",
  countryCode: "DE",
  registeredAddress: {
    line1: "One Strasse",
    city: "Berlin",
    postalCode: "10115",
    countryCode: "DE",
  },
  contactPerson: {
    name: "Lea Fischer",
    email: "lea@example.de",
    phone: "+491234567890",
  },
  bankDetails: {
    accountHolderName: "Rhein Data GmbH",
    bankCountryCode: "DE",
    currencyCode: "EUR",
    accountIdentifier: { scheme: "IBAN", value: "DE89370400440532013000" },
  },
  countryIdentifiers: [{ scheme: "VAT", value: "DE123456789" }],
  documents: [{
    kind: "INCORPORATION",
    objectKey: "vendors/vendor-1/documents/incorporation.pdf",
    uploadedAt: "2026-09-20T00:00:00.000Z",
  }],
};

function response(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  }));
}

function renderHome(
  session = specialistSession,
  navigate = vi.fn(),
) {
  return {
    navigate,
    ...render(
      <AuthenticatedShell initialSession={session}>
        <DashboardHome navigate={navigate} />
      </AuthenticatedShell>,
    ),
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("FR-REG-16/17/18 role-resolved dashboard", () => {
  it("renders the vendor home when both company records exist", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/vendors/me") {
        return response({
          ...completeCompany,
          _id: "vendor-1",
          ownerUserId: "user-1",
          state: "ACTIVE",
          capabilities: [{ taxonomySlug: "data-labeling" }],
        });
      }
      if (path === "/api/v1/clients/me") {
        return response({
          ...completeCompany,
          _id: "client-1",
          ownerUserId: "user-1",
          state: "APPROVED",
          website: "https://rhein.example",
          authorisedPerson: { name: "Lea Fischer" },
        });
      }
      throw new Error(`Unexpected request: ${String(path)}`);
    });

    renderHome();

    expect(await screen.findByRole("heading", { name: "Vendor workspace" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Client workspace" })).not.toBeInTheDocument();
    expect(screen.getByText("Rhein Data GmbH")).toBeVisible();
    expect(screen.getByText("Data labeling")).toBeVisible();
    expect(document.body).not.toHaveTextContent("vendors/vendor-1/documents/incorporation.pdf");
  });

  it("renders the client home for a client owner", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/vendors/me") return response({}, 404);
      if (path === "/api/v1/clients/me") {
        return response({
          ...completeCompany,
          _id: "client-1",
          ownerUserId: "user-1",
          state: "APPROVED",
          website: "https://rhein.example",
          authorisedPerson: { name: "Lea Fischer" },
        });
      }
      throw new Error(`Unexpected request: ${String(path)}`);
    });

    renderHome();

    expect(await screen.findByRole("heading", { name: "Client workspace" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Account" })).toBeVisible();
    expect(screen.getByText("Approved")).toBeVisible();
  });

  it("derives a DRAFT vendor's Next action and outstanding sections from the onboarding completeness checks", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/vendors/me") {
        return response({
          ...completeCompany,
          _id: "vendor-1",
          ownerUserId: "user-1",
          state: "DRAFT",
          contactPerson: undefined,
          capabilities: [],
        });
      }
      if (path === "/api/v1/clients/me") return response({}, 404);
      throw new Error(`Unexpected request: ${String(path)}`);
    });

    renderHome();

    const nextAction = await screen.findByRole("region", { name: "Next action" });
    expect(nextAction).toHaveTextContent("Registration is incomplete. Continue with Contact.");
    expect(within(nextAction).getByRole("link", { name: "Continue registration" }))
      .toHaveAttribute("href", "/register/vendor");
    const accreditation = screen.getByRole("region", { name: "Accreditation" });
    expect(accreditation).toHaveTextContent("Contact");
    expect(accreditation).toHaveTextContent("Capabilities");
  });

  it("does not send a submitted vendor back through registration", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/vendors/me") {
        return response({
          ...completeCompany,
          _id: "vendor-1",
          ownerUserId: "user-1",
          state: "SUBMITTED",
          capabilities: [{ taxonomySlug: "data-labeling" }],
        });
      }
      if (path === "/api/v1/clients/me") return response({}, 404);
      throw new Error(`Unexpected request: ${String(path)}`);
    });

    renderHome();

    const nextAction = await screen.findByRole("region", { name: "Next action" });
    expect(nextAction).toHaveTextContent("Your company registration has been submitted.");
    expect(within(nextAction).queryByRole("link", { name: /registration/i })).not.toBeInTheDocument();
  });

  it("resumes a DRAFT client at its first incomplete section", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/vendors/me") return response({}, 404);
      if (path === "/api/v1/clients/me") {
        return response({
          ...completeCompany,
          _id: "client-1",
          ownerUserId: "user-1",
          state: "DRAFT",
          bankDetails: undefined,
          website: "https://rhein.example",
          authorisedPerson: {
            name: "Lea Fischer",
            governmentIdentityDocument: {
              kind: "GOVERNMENT_IDENTITY",
              objectKey: "clients/client-1/authorised-person/identity.pdf",
              uploadedAt: "2026-09-20T00:00:00.000Z",
            },
          },
          contactPerson: undefined,
        });
      }
      throw new Error(`Unexpected request: ${String(path)}`);
    });

    renderHome();

    const nextAction = await screen.findByRole("region", { name: "Next action" });
    expect(nextAction).toHaveTextContent("Registration is incomplete. Continue with Contact.");
    expect(within(nextAction).getByRole("link", { name: "Continue registration" }))
      .toHaveAttribute("href", "/register/client");
  });

  it("renders the specialist home from the authoritative profile and keeps company registration reachable", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/vendors/me" || path === "/api/v1/clients/me") {
        return response({}, 404);
      }
      if (path === "/api/v1/profiles/me") {
        return response({
          userId: "user-1",
          state: "DRAFT",
          completionPercentage: 35,
        });
      }
      throw new Error(`Unexpected request: ${String(path)}`);
    });

    renderHome();

    expect(await screen.findByRole("heading", { name: "Specialist workspace" })).toBeVisible();
    expect(screen.getByText("35% complete")).toBeVisible();
    expect(screen.getByText("Draft")).toBeVisible();
    const profilePanel = screen.getByRole("region", { name: "Profile" });
    expect(within(profilePanel).getByRole("link", { name: "Continue profile" }))
      .toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: "Register a company" })).toHaveAttribute("href", "/register");
  });

  it.each([404, 500])("surfaces profile status %s instead of deriving a specialist action from absent data", async (status) => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/vendors/me" || path === "/api/v1/clients/me") {
        return response({}, 404);
      }
      if (path === "/api/v1/profiles/me") return response({}, status);
      throw new Error(`Unexpected request: ${String(path)}`);
    });

    renderHome();

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not load your profile");
    expect(screen.queryByRole("region", { name: "Next action" })).not.toBeInTheDocument();
  });

  it("does not treat a failed company ownership read as an absent company", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/vendors/me") return response({}, 500);
      if (path === "/api/v1/clients/me") return response({}, 404);
      throw new Error(`Unexpected request: ${String(path)}`);
    });

    renderHome();

    expect(await screen.findByRole("alert")).toHaveTextContent("We could not load your workspace");
    expect(fetchMock).not.toHaveBeenCalledWith("/api/v1/profiles/me", expect.anything());
  });

  it("redirects a no-company Verifier exactly once and does not fetch a specialist profile", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/vendors/me" || path === "/api/v1/clients/me") {
        return response({}, 404);
      }
      throw new Error(`Unexpected request: ${String(path)}`);
    });
    const navigate = vi.fn();

    renderHome(verifierSession, navigate);

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/company-reviews"));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalledWith("/api/v1/profiles/me", expect.anything());
  });

  it("does not mount or fetch the role home for an unauthenticated request", async () => {
    fetchMock.mockResolvedValue(response({}, 401));
    const navigate = vi.fn();

    render(
      <AuthenticatedShell navigate={navigate}>
        <DashboardHome />
      </AuthenticatedShell>,
    );

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("heading", { name: /workspace/i })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/session", { cache: "no-store" });
  });

  it("renders pending panels without numbers or invented operating values", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/vendors/me" || path === "/api/v1/clients/me") {
        return response({}, 404);
      }
      if (path === "/api/v1/profiles/me") {
        return response({ userId: "user-1", state: "APPROVED", completionPercentage: 100 });
      }
      throw new Error(`Unexpected request: ${String(path)}`);
    });

    renderHome();

    const pending = await screen.findByRole("region", { name: "Pending features" });
    expect(pending).not.toHaveTextContent(/\d/);
    expect(pending).not.toHaveTextContent(/sample|example|placeholder/i);
  });
});
