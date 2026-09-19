import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CompanyReviewConsole } from "./company-review-console";

const vendorId = "6aab715c9b5b373f0d8ea478";
const clientId = "6aab715c9b5b373f0d8ea479";

const queue = [
  { id: vendorId, companyType: "vendors", state: "SUBMITTED", submittedAt: "2026-09-17T00:31:00.000Z" },
  { id: clientId, companyType: "clients", state: "UNDER_REVIEW", submittedAt: "2026-09-17T01:15:00.000Z" },
];

const vendor = {
  _id: vendorId,
  state: "UNDER_REVIEW",
  legalName: "Rhein Data GmbH",
  countryCode: "DE",
  contactPerson: { name: "Lea Fischer", email: "lea@example.de", phone: "+491234567890" },
  documents: [{ kind: "incorporation", objectKey: "private/vendor/incorporation.pdf", uploadedAt: "2026-09-17T00:10:00.000Z" }],
  submittedAt: "2026-09-17T00:31:00.000Z",
};

const client = {
  _id: clientId,
  state: "UNDER_REVIEW",
  legalName: "Northstar Learning Pte Ltd",
  countryCode: "SG",
  authorisedPerson: {
    name: "Amelia Tan",
    governmentIdentityDocument: {
      kind: "government-identity",
      objectKey: "private/client/passport.pdf",
      uploadedAt: "2026-09-17T00:40:00.000Z",
    },
  },
  documents: [{ kind: "incorporation", objectKey: "private/client/incorporation.pdf", uploadedAt: "2026-09-17T00:35:00.000Z" }],
  submittedAt: "2026-09-17T01:15:00.000Z",
};

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  }));
}

describe("FR-REG-07A company verification console", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation((path: string) => {
      if (path === "/api/v1/company-reviews") return json(queue);
      if (path === `/api/v1/company-reviews/vendors/${vendorId}`) return json(vendor);
      if (path === `/api/v1/company-reviews/clients/${clientId}`) return json(client);
      throw new Error(`Unexpected request: ${path}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the nearly blind queue from only its four-field contract", async () => {
    render(<CompanyReviewConsole />);

    const list = await screen.findByRole("list", { name: "Company review queue" });
    expect(within(list).getByText(vendorId)).toBeVisible();
    expect(within(list).getByText(clientId)).toBeVisible();
    expect(within(list).getByText("Vendor")).toBeVisible();
    expect(within(list).getByText("Client")).toBeVisible();
    expect(within(list).getByText("Submitted")).toBeVisible();
    expect(within(list).getByText("Under review")).toBeVisible();
    expect(list).not.toHaveTextContent("Rhein Data GmbH");
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/company-reviews", { cache: "no-store" });
  });

  it("never offers an approval path for a vendor", async () => {
    render(<CompanyReviewConsole />);
    fireEvent.click(await screen.findByRole("button", { name: `Open vendor case ${vendorId}` }));

    await screen.findByRole("heading", { name: "Rhein Data GmbH" });
    expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request more information" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject company" })).toBeDisabled();
  });

  it("offers client approval but keeps every decision disabled until a reason is entered", async () => {
    render(<CompanyReviewConsole />);
    fireEvent.click(await screen.findByRole("button", { name: `Open client case ${clientId}` }));

    const approve = await screen.findByRole("button", { name: "Approve client" });
    const reject = screen.getByRole("button", { name: "Reject company" });
    const moreInfo = screen.getByRole("button", { name: "Request more information" });
    expect(approve).toBeDisabled();
    expect(reject).toBeDisabled();
    expect(moreInfo).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Decision reason"), {
      target: { value: "Reviewed required evidence" },
    });
    expect(approve).toBeEnabled();
    expect(reject).toBeEnabled();
    expect(moreInfo).toBeEnabled();
  });

  it("makes starting review feel like picking up a case while still requiring an audit note", async () => {
    fetchMock.mockImplementation((path: string) => {
      if (path === "/api/v1/company-reviews") return json(queue);
      if (path === `/api/v1/company-reviews/vendors/${vendorId}`) {
        return json({ ...vendor, state: "SUBMITTED" });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<CompanyReviewConsole />);
    fireEvent.click(await screen.findByRole("button", { name: `Open vendor case ${vendorId}` }));

    const start = await screen.findByRole("button", { name: "Pick up this case" });
    expect(start).toBeDisabled();
    expect(screen.getByText(/short audit note/i)).toBeVisible();
    fireEvent.change(screen.getByLabelText("Decision reason"), {
      target: { value: "Starting document review" },
    });
    expect(start).toBeEnabled();
  });

  it("preserves a PII-rejected reason and explains how to recover", async () => {
    const rejectedReason = "Checked against register HRB123456";
    fetchMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === "/api/v1/company-reviews") return json(queue);
      if (path === `/api/v1/company-reviews/clients/${clientId}` && !init?.method) return json(client);
      if (path.endsWith("/decisions")) {
        return json({ message: "Reason must not contain reviewed or identifying data" }, 400);
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<CompanyReviewConsole />);
    fireEvent.click(await screen.findByRole("button", { name: `Open client case ${clientId}` }));
    const reason = await screen.findByLabelText("Decision reason");
    fireEvent.change(reason, { target: { value: rejectedReason } });
    fireEvent.click(screen.getByRole("button", { name: "Approve client" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/identifying information/i);
    expect(screen.getByLabelText("Decision reason")).toHaveValue(rejectedReason);
  });

  it("reports a referenced document that is missing from storage", async () => {
    fetchMock.mockImplementation((path: string) => {
      if (path === "/api/v1/company-reviews") return json(queue);
      if (path === `/api/v1/company-reviews/vendors/${vendorId}`) return json(vendor);
      if (path.endsWith("/documents/incorporation/url")) {
        return json({ message: "document not found in storage" }, 404);
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<CompanyReviewConsole />);
    fireEvent.click(await screen.findByRole("button", { name: `Open vendor case ${vendorId}` }));
    fireEvent.click(await screen.findByRole("button", { name: "View incorporation" }));

    expect(await screen.findByText("Document not found in storage.")).toBeVisible();
    expect(window.open).not.toHaveBeenCalled();
  });

  it("fetches a fresh five-minute document URL on every click without persisting the credential", async () => {
    const localWrite = vi.spyOn(Storage.prototype, "setItem");
    let urlRequest = 0;
    fetchMock.mockImplementation((path: string) => {
      if (path === "/api/v1/company-reviews") return json(queue);
      if (path === `/api/v1/company-reviews/clients/${clientId}`) return json(client);
      if (path.endsWith("/documents/incorporation/url")) {
        urlRequest += 1;
        return json({ url: `https://signed.example/${urlRequest}`, expiresAt: "2026-09-19T12:05:00.000Z" });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    const { container } = render(<CompanyReviewConsole />);
    fireEvent.click(await screen.findByRole("button", { name: `Open client case ${clientId}` }));
    const view = await screen.findByRole("button", { name: "View incorporation" });
    fireEvent.click(view);
    await waitFor(() => expect(window.open).toHaveBeenCalledWith(
      "https://signed.example/1", "_blank", "noopener,noreferrer",
    ));
    fireEvent.click(view);
    await waitFor(() => expect(window.open).toHaveBeenCalledWith(
      "https://signed.example/2", "_blank", "noopener,noreferrer",
    ));

    expect(urlRequest).toBe(2);
    expect(localWrite).not.toHaveBeenCalled();
    expect(container).not.toHaveTextContent("https://signed.example/");
  });
});
