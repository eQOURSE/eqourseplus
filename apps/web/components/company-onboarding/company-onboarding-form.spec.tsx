import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  companyActorConfig,
  type CompanyActor,
} from "./company-onboarding-config";
import { CompanyOnboardingForm, schemaIssueField } from "./company-onboarding-form";

const fetchMock = vi.fn<typeof fetch>();

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const draft = {
  _id: "vendor-1",
  ownerUserId: "user-1",
  state: "DRAFT",
  capabilities: [],
  countryIdentifiers: [],
  documents: [],
};

const clientDraft = {
  _id: "client-1",
  ownerUserId: "user-1",
  state: "DRAFT",
  countryIdentifiers: [],
  documents: [],
};

const taxonomy = [
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Annotation",
    specialization: "Polygon",
    slug: "eqourse-ai-data-services-annotation-polygon",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Editing",
    specialization: null,
    slug: "eqourse-content-services-editing",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "Mathematics",
    specialization: null,
    slug: "tutrain-tutoring-mathematics",
  },
];

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation((path) => String(path).endsWith("/api/v1/skill-taxonomy")
    ? Promise.resolve(response(taxonomy))
    : Promise.resolve(response(draft)));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function renderReady(actor: CompanyActor): Promise<void> {
  render(<CompanyOnboardingForm actor={actor} />);
  await waitFor(() => expect(screen.getByLabelText("Country")).toBeEnabled());
}

async function goTo(step: string): Promise<void> {
  fireEvent.click(screen.getByRole("button", { name: step }));
  await screen.findByRole("heading", { name: step });
}

describe("generic company onboarding", () => {
  it("routes an unmapped schema issue to an actionable field", () => {
    expect(schemaIssueField("website")).toBe("website");
    expect(schemaIssueField("bankDetails.accountIdentifier.scheme")).toBe("bankAccountScheme");
    expect(schemaIssueField("documents.0.objectKey")).toBe("countryCode");
    expect(schemaIssueField("authorisedPerson.unexpectedDetail")).toBe("authorisedPersonName");
    expect(schemaIssueField("unexpectedField")).toBe("legalName");
  });
  it("lets a visitor fill and explore the vendor form without vendor API calls", async () => {
    render(<CompanyOnboardingForm actor="vendor" guest />);

    expect(screen.getByRole("heading", { name: "Register your company." })).toBeVisible();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
    expect(screen.getByLabelText("Legal name")).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Legal name"), {
      target: { value: "Example Company" },
    });
    expect(screen.getByLabelText("Legal name")).toHaveValue("Example Company");
    await waitFor(() => expect(screen.getByLabelText("Country")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "SG" } });
    fireEvent.click(screen.getByRole("button", { name: "Identifiers" }));
    expect(screen.getByLabelText("UEN")).toBeVisible();
    expect(screen.getByLabelText("UEN")).toBeEnabled();
    expect(screen.getByLabelText("Acra Record")).toBeEnabled();
    expect(screen.queryByLabelText("GSTIN")).toBeNull();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/skill-taxonomy",
    ));
    expect(fetchMock.mock.calls.every(([path]) => String(path).endsWith("/api/v1/skill-taxonomy"))).toBe(true);
  });

  it("creates an account and persists the filled guest draft before entering the authenticated flow", async () => {
    const onAuthenticated = vi.fn();
    const session = {
      userId: "user-1",
      email: "owner@example.com",
      roleAssignments: [],
      profileState: "DRAFT",
    };
    fetchMock.mockImplementation((path) => {
      if (String(path).endsWith("/api/v1/auth/register/request")) {
        return Promise.resolve(response({ status: "accepted", channels: ["email"] }));
      }
      if (path === "/api/auth/register/verify") return Promise.resolve(response({ ok: true }));
      if (path === "/api/auth/session") return Promise.resolve(response(session));
      if (path === "/api/v1/vendors") return Promise.resolve(response(draft, 201));
      return Promise.resolve(response(draft));
    });

    render(
      <CompanyOnboardingForm
        actor="vendor"
        guest
        onAuthenticated={onAuthenticated}
      />,
    );
    await waitFor(() => expect(screen.getByLabelText("Country")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Legal name"), {
      target: { value: "Guest Company" },
    });
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "SG" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("heading", { name: "Create account to save" })).toBeVisible();
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "+6591234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));

    expect(await screen.findByRole("heading", { name: "Verify your email" })).toBeVisible();
    fireEvent.change(screen.getByLabelText("Email verification code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify and save draft" }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith(session));
    const createCall = fetchMock.mock.calls.find(
      ([path, init]) => path === "/api/v1/vendors" && init?.method === "POST",
    );
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      legalName: "Guest Company",
      countryCode: "SG",
    });
  });

  it("offers existing users sign-in after the field-agnostic 409 and preserves their draft", async () => {
    const onAuthenticated = vi.fn();
    const session = {
      userId: "user-1",
      email: "owner@example.com",
      roleAssignments: [],
      profileState: "DRAFT",
    };
    fetchMock.mockImplementation((path) => {
      if (String(path).endsWith("/api/v1/auth/register/request")) {
        return Promise.resolve(response({
          statusCode: 409,
          code: "REGISTRATION_CONFLICT",
          message: "Registration conflicts with an existing account",
        }, 409));
      }
      if (String(path).endsWith("/api/v1/auth/otp/request")) {
        return Promise.resolve(response({ status: "accepted" }, 202));
      }
      if (path === "/api/auth/otp/verify") return Promise.resolve(response({ ok: true }));
      if (path === "/api/auth/session") return Promise.resolve(response(session));
      if (path === "/api/v1/vendors") return Promise.resolve(response(draft, 201));
      return Promise.resolve(response(draft));
    });

    render(
      <CompanyOnboardingForm
        actor="vendor"
        guest
        onAuthenticated={onAuthenticated}
      />,
    );
    await waitFor(() => expect(screen.getByLabelText("Country")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Legal name"), {
      target: { value: "Returning Company" },
    });
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "SG" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    fireEvent.change(await screen.findByLabelText("Email address"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "+6591234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));

    expect(await screen.findByRole("heading", {
      name: "You already have an account. Sign in to continue.",
    })).toBeVisible();
    expect(screen.getByText(/Returning Company/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }));
    expect(await screen.findByRole("heading", { name: "Enter your sign-in code" })).toBeVisible();
    fireEvent.change(screen.getByLabelText("Email sign-in code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in and save draft" }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith(session));
    const createCall = fetchMock.mock.calls.find(
      ([path, init]) => path === "/api/v1/vendors" && init?.method === "POST",
    );
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      legalName: "Returning Company",
      countryCode: "SG",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/auth\/otp\/request$/),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("presents required document uploads as actionable before account creation", async () => {
    render(<CompanyOnboardingForm actor="vendor" guest />);
    await waitFor(() => expect(screen.getByLabelText("Country")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "SG" } });
    fireEvent.click(screen.getByRole("button", { name: "Identifiers" }));

    const upload = screen.getByLabelText("Acra Record");
    expect(upload).toBeEnabled();
    expect(screen.getByText(
      "Create your account before uploading this document.",
      { selector: "#company-document-ACRA_RECORD-status" },
    )).toHaveAttribute("role", "status");
    fireEvent.change(upload, {
      target: { files: [new File(["pdf"], "acra.pdf", { type: "application/pdf" })] },
    });
    expect(await screen.findByText(
      "Create your account, then choose this file again to upload it.",
    )).toHaveAttribute("role", "alert");
  });

  it("keeps the actor differences in configuration rather than component branches", () => {
    expect(companyActorConfig.vendor).toEqual({
      bankDetails: true,
      capabilities: true,
      website: false,
      authorisedPerson: false,
    });
    expect(companyActorConfig.client).toEqual({
      bankDetails: false,
      capabilities: false,
      website: true,
      authorisedPerson: true,
    });
  });

  it("renders the vendor sections and excludes client-only fields", async () => {
    await renderReady("vendor");

    expect(screen.getByRole("heading", { name: "Company" })).toBeVisible();
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Company",
      "Address",
      "Contact",
      "Identifiers",
      "Capabilities",
      "Review",
      "Save draft",
      "Continue to Address",
    ]);
    expect(screen.getByRole("group", { name: "Bank details" })).toBeVisible();
    await goTo("Capabilities");
    expect(screen.getByRole("heading", { name: "Capabilities" })).toBeVisible();
    expect(screen.queryByLabelText("Website")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Authorised person" })).toBeNull();
  });

  it("loads, groups, searches, selects, and removes endpoint taxonomy options", async () => {
    render(<CompanyOnboardingForm actor="vendor" guest />);
    await waitFor(() => expect(screen.getByLabelText("Country")).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Capabilities" }));

    expect(await screen.findByRole("heading", { name: "EQOURSE" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "AI Data Services" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Content Services" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "TUTRAIN" })).toBeVisible();
    expect(screen.getByRole("button", {
      name: "Select EQOURSE AI Data Services Polygon",
    })).toHaveTextContent("Polygon");
    expect(screen.getByRole("button", {
      name: "Select EQOURSE Content Services Editing",
    })).toHaveTextContent("Editing");

    fireEvent.change(screen.getByRole("searchbox", { name: "Search services" }), {
      target: { value: "polygon" },
    });
    expect(screen.queryByText("Mathematics")).toBeNull();
    fireEvent.click(screen.getByRole("button", {
      name: "Select EQOURSE AI Data Services Polygon",
    }));

    expect(screen.getByRole("list", { name: "Selected services" })).toHaveTextContent("Polygon");
    const remove = screen.getByRole("button", { name: "Remove Polygon" });
    remove.focus();
    expect(remove).toHaveFocus();
    fireEvent.click(remove);
    expect(screen.queryByRole("list", { name: "Selected services" })).toBeNull();
  });

  it("saves only selected taxonomy slugs", async () => {
    await renderReady("vendor");
    await goTo("Capabilities");
    fireEvent.click(await screen.findByRole("button", {
      name: "Select EQOURSE AI Data Services Polygon",
    }));
    await goTo("Review");

    const saves = fetchMock.mock.calls.filter(
      ([path, init]) => path === "/api/v1/vendors/me" && init?.method === "PATCH",
    );
    const payload = JSON.parse(String(saves.at(-1)?.[1]?.body));
    expect(payload.capabilities).toEqual([
      { taxonomySlug: "eqourse-ai-data-services-annotation-polygon" },
    ]);
    expect(JSON.stringify(payload.capabilities)).not.toContain("businessUnit");
    expect(JSON.stringify(payload.capabilities)).not.toContain("serviceLine");
    expect(JSON.stringify(payload.capabilities)).not.toContain("specialization");
  });

  it("shows a retryable taxonomy error without inventing fallback options", async () => {
    let taxonomyRequests = 0;
    fetchMock.mockImplementation((path) => {
      if (String(path).endsWith("/api/v1/skill-taxonomy")) {
        taxonomyRequests += 1;
        return Promise.resolve(taxonomyRequests === 1
          ? response({ message: "Unavailable" }, 503)
          : response(taxonomy));
      }
      return Promise.resolve(response(draft));
    });
    render(<CompanyOnboardingForm actor="vendor" guest />);
    await waitFor(() => expect(screen.getByLabelText("Country")).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Capabilities" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The service list could not be loaded. Try again.",
    );
    expect(screen.queryByRole("searchbox", { name: "Search services" })).toBeNull();
    expect(screen.queryByText("No services available")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading services" }));
    expect(await screen.findByRole("searchbox", { name: "Search services" })).toBeEnabled();
    expect(taxonomyRequests).toBe(2);
  });

  it("can render the same flow for a client without vendor-only sections", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/clients/me") return Promise.resolve(response(clientDraft));
      return Promise.resolve(response({}, 404));
    });
    await renderReady("client");

    expect(screen.getByLabelText("Website")).toBeVisible();
    expect(screen.getByRole("group", { name: "Authorised person" })).toBeVisible();
    expect(screen.queryByRole("group", { name: "Bank details" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Capabilities" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Capabilities" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "SG" } });
    await goTo("Identifiers");
    expect(screen.getByLabelText("Acra Record")).toBeVisible();
    expect(screen.queryByLabelText("Bank Proof")).toBeNull();
    await goTo("Review");
    expect(screen.queryByRole("button", { name: "Edit Capabilities" })).toBeNull();
    expect(document.body.textContent).not.toMatch(/bank details|capabilities/i);
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/clients/me", { cache: "no-store" });
    expect(fetchMock.mock.calls.some(([path]) => String(path).includes("/vendors"))).toBe(false);
    expect(fetchMock.mock.calls.some(([path]) => String(path).endsWith("/skill-taxonomy"))).toBe(false);
  });

  it("saves a client draft through the client endpoint without vendor-only fields", async () => {
    fetchMock.mockImplementation((path) => path === "/api/v1/clients/me"
      ? Promise.resolve(response(clientDraft))
      : Promise.resolve(response({}, 404)));
    await renderReady("client");
    fireEvent.change(screen.getByLabelText("Legal name"), {
      target: { value: "Client Company" },
    });
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "SG" } });
    fireEvent.change(screen.getByLabelText("Website"), {
      target: { value: "https://client.example" },
    });
    fireEvent.change(screen.getByLabelText("Authorised person name"), {
      target: { value: "A. Person" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/clients/me",
      expect.objectContaining({ method: "PATCH" }),
    ));
    const save = fetchMock.mock.calls.findLast(
      ([path, init]) => path === "/api/v1/clients/me" && init?.method === "PATCH",
    );
    const payload = JSON.parse(String(save?.[1]?.body));
    expect(payload).toMatchObject({
      legalName: "Client Company",
      countryCode: "SG",
      website: "https://client.example",
      authorisedPerson: { name: "A. Person" },
    });
    expect(payload).not.toHaveProperty("bankDetails");
    expect(payload).not.toHaveProperty("capabilities");
  });

  it("puts an actionable website error beside and focuses the website input", async () => {
    fetchMock.mockImplementation((path) => path === "/api/v1/clients/me"
      ? Promise.resolve(response(clientDraft))
      : Promise.resolve(response({}, 404)));
    await renderReady("client");
    fireEvent.change(screen.getByLabelText("Website"), {
      target: { value: "javascript:alert(1)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    const website = screen.getByLabelText("Website");
    expect(website).toHaveFocus();
    expect(website).toHaveAttribute("aria-invalid", "true");
    expect(website).toHaveAccessibleDescription(/website.*http/i);
    expect(screen.getByText(/website.*http/i)).toHaveClass("company-onboarding-error");
  });

  it("saves a scheme-less website using the normalized shared-schema value", async () => {
    fetchMock.mockImplementation((path) => path === "/api/v1/clients/me"
      ? Promise.resolve(response(clientDraft))
      : Promise.resolve(response({}, 404)));
    await renderReady("client");
    fireEvent.change(screen.getByLabelText("Website"), {
      target: { value: "www.eqourse.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/clients/me",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"website":"https://www.eqourse.com"'),
      }),
    ));
  });

  it("explains the identity upload deferral before file selection without error styling", async () => {
    render(<CompanyOnboardingForm actor="client" guest />);
    await waitFor(() => expect(screen.getByLabelText("Country")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Authorised person name"), {
      target: { value: "A. Person" },
    });
    const input = screen.getByLabelText("Government identity document");
    expect(input).toBeDisabled();
    const guidance = screen.getByText(/create your account.*upload/i);
    expect(guidance).toHaveClass("company-onboarding-help");
    expect(guidance).not.toHaveClass("company-onboarding-error");
  });

  it("guides Indian clients to alternatives and UIDAI masked Aadhaar without fake attestation", async () => {
    fetchMock.mockImplementation((path) => path === "/api/v1/clients/me"
      ? Promise.resolve(response(clientDraft))
      : Promise.resolve(response({}, 404)));
    await renderReady("client");
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "IN" } });

    const identityType = screen.getByLabelText("Government identity document type");
    expect(Array.from(identityType.querySelectorAll("option"), (option) => option.textContent)).toEqual([
      "Passport",
      "Driving licence",
      "Voter ID",
      "Masked Aadhaar",
    ]);
    expect(screen.getByText(/Aadhaar must be masked/i)).toBeVisible();
    expect(screen.getByRole("link", { name: "Download masked Aadhaar from UIDAI" })).toHaveAttribute(
      "href",
      "https://myaadhaar.uidai.gov.in/genricDownloadAadhaar/en",
    );
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("uploads the authorised person's government ID through its dedicated client path", async () => {
    const credential = {
      uploadUrl: "https://r2.example.test/identity?X-Amz-Signature=secret",
      objectKey: "clients/client-1/authorised-person/government-identity-document/PASSPORT/id.pdf",
      expiresAt: "2026-09-16T12:05:00.000Z",
    };
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/clients/me/authorised-person/government-identity-document/upload-url") {
        return Promise.resolve(response(credential));
      }
      if (String(path).startsWith("https://r2.example.test/")) {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      if (path === "/api/v1/clients/me") return Promise.resolve(response(clientDraft));
      return Promise.resolve(response({}, 404));
    });
    await renderReady("client");
    fireEvent.change(screen.getByLabelText("Authorised person name"), {
      target: { value: "A. Person" },
    });
    const file = new File(["identity"], "id.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Government identity document"), {
      target: { files: [file] },
    });

    expect(await screen.findByText("id.pdf uploaded. Choose another file to replace it.")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/clients/me/authorised-person/government-identity-document/upload-url",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          kind: "PASSPORT",
          contentType: "application/pdf",
          size: file.size,
        }),
      }),
    );
    const save = fetchMock.mock.calls.findLast(
      ([path, init]) => path === "/api/v1/clients/me" && init?.method === "PATCH",
    );
    expect(JSON.parse(String(save?.[1]?.body))).toMatchObject({
      authorisedPerson: {
        name: "A. Person",
        governmentIdentityDocument: {
          kind: "PASSPORT",
          objectKey: credential.objectKey,
          uploadedAt: expect.any(String),
        },
      },
    });
    expect(JSON.parse(String(save?.[1]?.body))).not.toHaveProperty("documents.0");
  });

  it("renders only registry-required identifiers for the selected country", async () => {
    await renderReady("vendor");
    const country = screen.getByLabelText("Country");

    fireEvent.change(country, { target: { value: "IN" } });
    await goTo("Identifiers");
    expect(screen.getByLabelText("GSTIN")).toBeVisible();
    expect(screen.getByLabelText("Company PAN")).toBeVisible();
    expect(screen.getByLabelText("Udyam")).toBeVisible();
    expect(screen.queryByLabelText("UEN")).toBeNull();

    await goTo("Company");
    const companyCountry = screen.getByLabelText("Country");
    fireEvent.change(companyCountry, { target: { value: "SG" } });
    await goTo("Identifiers");
    expect(screen.getByLabelText("UEN")).toBeVisible();
    expect(screen.queryByLabelText("GSTIN")).toBeNull();
    expect(screen.queryByLabelText("Company PAN")).toBeNull();
    expect(screen.queryByLabelText("Udyam")).toBeNull();

    await goTo("Company");
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "CN" } });
    await goTo("Identifiers");
    expect(screen.getByLabelText("Unified social credit code")).toBeVisible();
    expect(screen.queryByLabelText("UEN")).toBeNull();

    await goTo("Company");
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "DE" } });
    await goTo("Identifiers");
    expect(screen.getByLabelText("EU VAT")).toBeVisible();
    expect(screen.queryByLabelText("Unified social credit code")).toBeNull();
  });

  it("uploads directly to R2, records only the object reference, and supports replacement", async () => {
    const firstCredential = {
      uploadUrl: "https://r2.example.test/first?X-Amz-Signature=secret-one",
      objectKey: "vendors/vendor-1/BANK_PROOF/first.pdf",
      expiresAt: "2026-09-15T12:05:00.000Z",
    };
    const secondCredential = {
      uploadUrl: "https://r2.example.test/second?X-Amz-Signature=secret-two",
      objectKey: "vendors/vendor-1/BANK_PROOF/second.png",
      expiresAt: "2026-09-15T12:05:00.000Z",
    };
    const credentials = [firstCredential, secondCredential];
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/vendors/me/documents/upload-url") {
        return Promise.resolve(response(credentials.shift()));
      }
      if (String(path).startsWith("https://r2.example.test/")) {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      return Promise.resolve(response(draft));
    });
    await renderReady("vendor");
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "IN" } });
    await goTo("Identifiers");

    const input = screen.getByLabelText("Bank Proof");
    const first = new File(["pdf"], "proof.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [first] } });
    expect(await screen.findByText("proof.pdf uploaded. Choose another file to replace it.")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(firstCredential.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      body: first,
    });
    expect(document.body.textContent).not.toContain(firstCredential.uploadUrl);
    const patchCalls = fetchMock.mock.calls.filter(
      ([path, options]) => path === "/api/v1/vendors/me" && options?.method === "PATCH",
    );
    const firstPatch = patchCalls.at(-1);
    expect(JSON.parse(String(firstPatch?.[1]?.body)).documents).toEqual([
      {
        kind: "BANK_PROOF",
        objectKey: firstCredential.objectKey,
        uploadedAt: expect.any(String),
      },
    ]);

    const replacement = new File(["png"], "replacement.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [replacement] } });
    expect(await screen.findByText("replacement.png uploaded. Choose another file to replace it.")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(secondCredential.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: replacement,
    });
  });

  it("announces pending and actionable failed upload states", async () => {
    let finishUpload: ((response: Response) => void) | undefined;
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/vendors/me/documents/upload-url") {
        return Promise.resolve(response({
          uploadUrl: "https://r2.example.test/fail?X-Amz-Signature=secret",
          objectKey: "vendors/vendor-1/BANK_PROOF/fail.pdf",
          expiresAt: "2026-09-15T12:05:00.000Z",
        }));
      }
      if (String(path).startsWith("https://r2.example.test/")) {
        return new Promise((resolve) => { finishUpload = resolve; });
      }
      return Promise.resolve(response(draft));
    });
    await renderReady("vendor");
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "IN" } });
    await goTo("Identifiers");
    fireEvent.change(screen.getByLabelText("Bank Proof"), {
      target: { files: [new File(["pdf"], "proof.pdf", { type: "application/pdf" })] },
    });

    expect(await screen.findByText("Uploading proof.pdf…")).toHaveAttribute("role", "status");
    finishUpload?.(new Response(null, { status: 500 }));
    expect(await screen.findByText("Upload failed for proof.pdf. Choose the file and try again.")).toHaveAttribute("role", "alert");
  });

  it("persists a step through the authenticated vendor draft endpoint", async () => {
    await renderReady("vendor");
    fireEvent.change(screen.getByLabelText("Legal name"), {
      target: { value: "Example Company" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to Address" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/vendors/me",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    expect(JSON.parse(String(fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH")?.[1]?.body))).toMatchObject({
      legalName: "Example Company",
    });
    expect(screen.getByRole("heading", { name: "Address" })).toBeVisible();
  });

  it("waits for saving before a native step button changes sections", async () => {
    await renderReady("vendor");
    let finishSave: ((response: Response) => void) | undefined;
    fetchMock.mockImplementation((_path, init) => init?.method === "PATCH"
      ? new Promise<Response>((resolve) => { finishSave = resolve; })
      : Promise.resolve(response(draft)));
    fireEvent.change(screen.getByLabelText("Legal name"), {
      target: { value: "Keyboard Company" },
    });
    const addressStep = screen.getByRole("button", { name: "Address" });
    expect(addressStep.tagName).toBe("BUTTON");
    expect(addressStep).not.toHaveAttribute("tabindex", "-1");
    addressStep.focus();
    expect(addressStep).toHaveFocus();
    fireEvent.click(addressStep);

    expect(screen.getByRole("heading", { name: "Company" })).toBeVisible();
    await waitFor(() => expect(finishSave).toBeDefined());
    finishSave?.(response(draft));
    expect(await screen.findByRole("heading", { name: "Address" })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/vendors/me",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("exposes every onboarding section through focusable native buttons", async () => {
    render(<CompanyOnboardingForm actor="vendor" guest />);
    await waitFor(() => expect(screen.getByLabelText("Country")).toBeEnabled());

    for (const section of ["Company", "Address", "Contact", "Identifiers", "Capabilities", "Review"]) {
      const control = screen.getByRole("button", { name: section });
      expect(control.tagName).toBe("BUTTON");
      expect(control).not.toHaveAttribute("tabindex", "-1");
      control.focus();
      expect(control).toHaveFocus();
      fireEvent.click(control);
      expect(screen.getByRole("heading", { name: section })).toBeVisible();
    }
  });

  it("restores a partially saved company step on return", async () => {
    fetchMock.mockImplementation((path) => String(path).endsWith("/api/v1/skill-taxonomy")
      ? Promise.resolve(response(taxonomy))
      : Promise.resolve(response({ ...draft, legalName: "Saved company" })));
    render(<CompanyOnboardingForm actor="vendor" />);
    expect(await screen.findByLabelText("Legal name")).toHaveValue("Saved company");
    expect(screen.getByRole("heading", { name: "Company" })).toBeVisible();
  });

  it("announces shared-schema validation and focuses the invalid field", async () => {
    await renderReady("vendor");
    await goTo("Contact");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "A. Person" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "12345" } });
    const priorPatchCount = fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH").length;
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/email/i);
    expect(screen.getByLabelText("Email")).toHaveFocus();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(priorPatchCount);
  });

  it("resumes on the first incomplete step using the saved draft", async () => {
    fetchMock.mockReset();
    fetchMock.mockImplementation((path) => String(path).endsWith("/api/v1/skill-taxonomy")
      ? Promise.resolve(response(taxonomy))
      : Promise.resolve(response({
        ...draft,
        legalName: "Example Company",
        countryCode: "IN",
        registeredAddress: {
          line1: "One Street",
          city: "Mumbai",
          postalCode: "400001",
          countryCode: "IN",
        },
        bankDetails: {
          accountHolderName: "Example Company",
          bankCountryCode: "IN",
          currencyCode: "INR",
          accountIdentifier: { scheme: "ACCOUNT", value: "1234567890" },
        },
      })));
    render(<CompanyOnboardingForm actor="vendor" />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Contact" })).toBeVisible());

    expect(screen.getByRole("heading", { name: "Contact" })).toBeVisible();
    expect(screen.getByText("Company")).toHaveAttribute("data-current", "false");
    await goTo("Company");
    expect(screen.getByLabelText("Legal name")).toHaveValue("Example Company");
  });

  it("lets review jump back to a section and submit the registration", async () => {
    await renderReady("vendor");
    await goTo("Review");

    expect(screen.getByRole("heading", { name: "Review" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Edit Company" }));
    expect(screen.getByRole("heading", { name: "Company" })).toBeVisible();
  });

  it("shows all entered client-only values in review", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/clients/me/authorised-person/government-identity-document/upload-url") {
        return Promise.resolve(response({
          uploadUrl: "https://r2.example.test/review-identity",
          objectKey: "clients/client-1/authorised-person/government-identity-document/PASSPORT/identity.pdf",
          expiresAt: "2026-09-16T12:05:00.000Z",
        }));
      }
      if (path === "https://r2.example.test/review-identity") {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      return Promise.resolve(response(clientDraft));
    });
    await renderReady("client");
    fireEvent.change(screen.getByLabelText("Website"), {
      target: { value: "https://example.com" },
    });
    fireEvent.change(screen.getByLabelText("Authorised person name"), {
      target: { value: "A. Person" },
    });
    fireEvent.change(screen.getByLabelText("Government identity document"), {
      target: { files: [new File(["id"], "identity.pdf", { type: "application/pdf" })] },
    });
    await screen.findByText("identity.pdf uploaded. Choose another file to replace it.");
    await goTo("Review");

    expect(screen.getByText("https://example.com")).toBeVisible();
    expect(screen.getByText("A. Person")).toBeVisible();
    expect(screen.getByText("identity.pdf")).toBeVisible();
  });

  it("shows an honest under-review status after submission", async () => {
    await renderReady("vendor");
    await goTo("Review");
    fireEvent.click(screen.getByRole("button", { name: "Submit registration" }));

    expect(await screen.findByRole("heading", { name: "Registration under review" })).toBeVisible();
    expect(screen.getByText(/under review by the compliance team/i)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Submit registration" })).toBeNull();
  });

  it("submits a client through the client endpoint and shows the same honest review state", async () => {
    fetchMock.mockImplementation((path) => {
      if (path === "/api/v1/clients/me/submit") {
        return Promise.resolve(response({ ...clientDraft, state: "SUBMITTED" }));
      }
      if (path === "/api/v1/clients/me") return Promise.resolve(response(clientDraft));
      return Promise.resolve(response({}, 404));
    });
    await renderReady("client");
    await goTo("Review");
    fireEvent.click(screen.getByRole("button", { name: "Submit registration" }));

    expect(await screen.findByRole("heading", { name: "Registration under review" })).toBeVisible();
    expect(screen.getByText(/under review by the compliance team/i)).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/clients/me/submit", { method: "POST" });
    expect(fetchMock.mock.calls.some(([path]) => path === "/api/v1/vendors/me/submit")).toBe(false);
  });

  it("surfaces every rejected submission requirement as a section link and keeps unknown codes", async () => {
    await renderReady("vendor");
    fetchMock.mockImplementation((path) => path === "/api/v1/vendors/me/submit"
      ? Promise.resolve(response({
        message: "Vendor is missing required submission information",
        missing: [
          "business_details",
          "bank_details",
          "country_requirements",
          "country_identifiers",
          "documents",
          "capabilities",
          "future_requirement",
        ],
      }, 400))
      : Promise.resolve(response(draft)));
    await goTo("Review");
    fireEvent.click(screen.getByRole("button", { name: "Submit registration" }));

    expect(await screen.findByRole("heading", { name: "Company" })).toBeVisible();
    expect(screen.getByLabelText("Legal name")).toHaveFocus();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Complete these requirements before submitting:");
    expect(screen.getByRole("link", {
      name: "Business details: enter your company, registered address, and contact information",
    })).toHaveAttribute("href", "#company-section-title");
    expect(screen.getByRole("link", {
      name: "Bank details: enter the account holder, bank country, currency, and account identifier",
    })).toHaveAttribute("href", "#company-section-title");
    expect(screen.getByRole("link", {
      name: "Country requirements: choose a supported country for this registration",
    })).toHaveAttribute("href", "#company-section-title");
    expect(screen.getByRole("link", {
      name: "Identifiers: enter every identifier required for your country",
    })).toHaveAttribute("href", "#identifiers-section-title");
    expect(screen.getByRole("link", {
      name: "Required documents: upload every document required for your country",
    })).toHaveAttribute("href", "#identifiers-section-title");
    const capabilities = screen.getByRole("link", {
      name: "Capabilities: select at least one service you can deliver",
    });
    expect(capabilities).toHaveAttribute("href", "#capabilities-section-title");
    expect(screen.getByRole("link", {
      name: "future_requirement: review this requirement and try again",
    })).toHaveAttribute("href", "#review-section-title");

    fireEvent.click(capabilities);
    expect(await screen.findByRole("heading", { name: "Capabilities" })).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "Search services" })).toHaveFocus();
  });
});
