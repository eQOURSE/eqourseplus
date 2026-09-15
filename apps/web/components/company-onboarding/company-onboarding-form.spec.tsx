import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  companyActorConfig,
  type CompanyActor,
} from "./company-onboarding-config";
import { CompanyOnboardingForm } from "./company-onboarding-form";

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

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(response(draft));
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
    expect(fetchMock).not.toHaveBeenCalled();
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

  it("can render the same flow for a client without vendor-only sections", async () => {
    await renderReady("client");

    expect(screen.getByLabelText("Website")).toBeVisible();
    expect(screen.getByRole("group", { name: "Authorised person" })).toBeVisible();
    expect(screen.queryByRole("group", { name: "Bank details" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Capabilities" })).toBeNull();
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
    fetchMock.mockResolvedValueOnce(response({ ...draft, legalName: "Saved company" }));
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
    fetchMock.mockResolvedValue(
      response({
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
      }),
    );
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

  it("returns focus to the first missing section after a rejected submission", async () => {
    await renderReady("vendor");
    fetchMock.mockImplementation((path) => path === "/api/v1/vendors/me/submit"
      ? Promise.resolve(response({
        message: "Vendor is missing required submission information",
        missing: ["business_details", "documents"],
      }, 400))
      : Promise.resolve(response(draft)));
    await goTo("Review");
    fireEvent.click(screen.getByRole("button", { name: "Submit registration" }));

    expect(await screen.findByRole("heading", { name: "Company" })).toBeVisible();
    expect(screen.getByLabelText("Legal name")).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent(/required/i);
  });
});
