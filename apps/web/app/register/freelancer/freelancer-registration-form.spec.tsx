import { renderToString } from "react-dom/server";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ISO_COUNTRY_CODES,
  createCountryOptions,
} from "../country-codes";
import { FreelancerRegistrationForm } from "./freelancer-registration-form";

const fetchMock = vi.fn<typeof fetch>();

function acceptedResponse(): Response {
  return new Response(JSON.stringify({ status: "accepted" }), {
    status: 202,
    headers: { "Content-Type": "application/json" },
  });
}

function tokenResponse(): Response {
  return new Response(
    JSON.stringify({ accessToken: "secret-access", refreshToken: "secret-refresh" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

async function renderReadyForm(): Promise<void> {
  render(<FreelancerRegistrationForm />);
  await waitFor(() => expect(screen.getByLabelText("Country")).toBeEnabled());
}

async function submitValidDetails(countryCode = "US"): Promise<void> {
  fireEvent.change(screen.getByLabelText("Country"), {
    target: { value: countryCode },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "Person@Example.com " },
  });
  fireEvent.change(screen.getByLabelText("Phone number"), {
    target: { value: " +14155552671 " },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Send verification codes" }),
  );
  await screen.findByRole("heading", { name: "Verification codes" });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("FR-REG-01 freelancer registration form", () => {
  it("server-renders an accessible loading fallback before enabling country options", async () => {
    const serverMarkup = renderToString(<FreelancerRegistrationForm />);

    expect(serverMarkup).toContain("Loading countries…");
    expect(serverMarkup).toContain('aria-busy="true"');
    expect(serverMarkup).toContain("disabled");

    await renderReadyForm();

    expect(screen.getByLabelText("Country")).toBeEnabled();
    expect(screen.getByLabelText("Country")).not.toHaveAttribute("aria-busy");
  });

  it("renders enabled ISO country options with Intl.DisplayNames labels in display-name order", async () => {
    await renderReadyForm();

    const select = screen.getByLabelText<HTMLSelectElement>("Country");
    const rendered = Array.from(select.options).slice(1);
    const expected = createCountryOptions();

    expect(ISO_COUNTRY_CODES).toHaveLength(249);
    expect(new Set(ISO_COUNTRY_CODES)).toHaveProperty("size", 249);
    expect(ISO_COUNTRY_CODES.every((code) => /^[A-Z]{2}$/.test(code))).toBe(
      true,
    );
    expect(rendered.map((option) => option.value)).toEqual(
      expected.map((option) => option.code),
    );
    expect(rendered.map((option) => option.textContent)).toEqual(
      expected.map((option) => option.name),
    );
    expect(expected.map((option) => option.name)).toEqual(
      expected
        .map((option) => option.name)
        .toSorted((left, right) => left.localeCompare(right, "en")),
    );
  });

  it("resolves every ISO code to a real region name", () => {
    for (const { code, name } of createCountryOptions()) {
      expect(name, code).not.toBe(code);
    }
  });

  it("shows PAN only for India and clears it when country changes", async () => {
    await renderReadyForm();
    const country = screen.getByLabelText("Country");

    expect(screen.queryByLabelText("PAN (optional)")).toBeNull();
    fireEvent.change(country, { target: { value: "IN" } });
    const panField = screen.getByLabelText("PAN (optional)");
    expect(
      (panField.closest("form")?.textContent ?? "").match(
        /\b(?:PAN|GSTIN|UEN|CIN|LLPIN)\b|\b(?:tax|company) registration number\b/gi,
      ) ?? [],
    ).toEqual(["PAN"]);
    fireEvent.change(panField, {
      target: { value: "abcde1234f" },
    });
    fireEvent.change(country, { target: { value: "SG" } });
    expect(screen.queryByLabelText("PAN (optional)")).toBeNull();
    fireEvent.change(country, { target: { value: "IN" } });
    expect(screen.getByLabelText("PAN (optional)")).toHaveValue("");
  });

  it("rejects malformed email and non-E.164 phone before fetching", async () => {
    await renderReadyForm();
    fireEvent.change(screen.getByLabelText("Country"), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "4155552671" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Send verification codes" }),
    );

    expect(await screen.findByText("Enter a valid email address.")).toBeVisible();
    expect(
      screen.getByText(
        "Enter a valid international phone number beginning with +.",
      ),
    ).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("focuses the first invalid field and binds errors to their controls", async () => {
    await renderReadyForm();
    const country = screen.getByLabelText("Country");
    fireEvent.click(
      screen.getByRole("button", { name: "Send verification codes" }),
    );

    expect(await screen.findByText("Choose your country.")).toBeVisible();
    expect(country).toHaveFocus();
    expect(country).toHaveAccessibleName("Country");
    expect(country).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("registration-country-error"),
    );
    expect(
      screen.getByText("Check the highlighted fields and try again."),
    ).toHaveAttribute("aria-live", "polite");
  });

  it("posts the exact normalized registration request to the public API", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.eqourse.test/");
    fetchMock.mockResolvedValueOnce(acceptedResponse());
    await renderReadyForm();

    fireEvent.change(screen.getByLabelText("Country"), {
      target: { value: "IN" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: " Person@Example.com " },
    });
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: " +919876543210 " },
    });
    fireEvent.change(screen.getByLabelText("PAN (optional)"), {
      target: { value: " abcde1234f " },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Send verification codes" }),
    );

    await screen.findByRole("heading", { name: "Verification codes" });
    const [url, options] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.eqourse.test/api/v1/auth/register/request");
    expect(options).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(String(options?.body))).toEqual({
      countryCode: "IN",
      email: "person@example.com",
      phone: "+919876543210",
      pan: "ABCDE1234F",
    });
  });

  it("uses the localhost API URL when public configuration is absent", async () => {
    fetchMock.mockResolvedValueOnce(acceptedResponse());
    await renderReadyForm();
    await submitValidDetails();

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/api/v1/auth/register/request",
    );
  });

  it("renders a field-agnostic message for a registration conflict", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: "REGISTRATION_CONFLICT",
          message: "phone and PAN already exist",
        }),
        { status: 409 },
      ),
    );
    await renderReadyForm();
    fireEvent.change(screen.getByLabelText("Country"), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "+14155552671" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Send verification codes" }),
    );

    const message = await screen.findByText(
      "We could not start this registration. Check your details or try again later.",
    );
    expect(message).toBeVisible();
    expect(message.textContent).not.toMatch(/phone|PAN/i);
  });

  it("posts both OTPs together and shows confirmation without persisting tokens", async () => {
    fetchMock
      .mockResolvedValueOnce(acceptedResponse())
      .mockResolvedValueOnce(tokenResponse());
    await renderReadyForm();
    await submitValidDetails();
    fireEvent.change(screen.getByLabelText("Email verification code"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("Phone verification code"), {
      target: { value: "654321" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Verify and create account" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Your account is created." }),
    ).toBeVisible();
    expect(fetchMock.mock.calls[1]).toEqual([
      "http://localhost:4000/api/v1/auth/register/verify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "person@example.com",
          phone: "+14155552671",
          emailOtp: "123456",
          phoneOtp: "654321",
        }),
      },
    ]);
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
    expect(document.body).not.toHaveTextContent("secret-access");
    expect(document.body).not.toHaveTextContent("secret-refresh");
  });

  it("keeps verification active after an unauthorized response", async () => {
    fetchMock
      .mockResolvedValueOnce(acceptedResponse())
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    await renderReadyForm();
    await submitValidDetails();
    fireEvent.change(screen.getByLabelText("Email verification code"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText("Phone verification code"), {
      target: { value: "654321" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Verify and create account" }),
    );

    expect(
      await screen.findByText(
        "Those verification codes are invalid or have expired. Check both codes and try again.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Verification codes" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Your account is created." }),
    ).toBeNull();
  });

  it("removes PAN from the DOM after details submission", async () => {
    fetchMock.mockResolvedValueOnce(acceptedResponse());
    await renderReadyForm();
    fireEvent.change(screen.getByLabelText("Country"), {
      target: { value: "IN" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "+919876543210" },
    });
    fireEvent.change(screen.getByLabelText("PAN (optional)"), {
      target: { value: "ABCDE1234F" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Send verification codes" }),
    );

    await screen.findByRole("heading", { name: "Verification codes" });
    expect(screen.queryByText(/PAN/i)).toBeNull();
    expect(document.body).not.toHaveTextContent("ABCDE1234F");
  });
});
