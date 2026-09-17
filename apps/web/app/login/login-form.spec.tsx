import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const fetchMock = vi.fn<typeof fetch>();

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const session = {
  userId: "user-1",
  email: "owner@example.com",
  roleAssignments: [],
  profileState: "DRAFT",
};

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(response({}, 401));
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("FR-FND-02 / FR-REG-02A login form", () => {
  it("validates the email before requesting an OTP directly from the API", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.eqourse.test/");
    render(<LoginForm navigate={vi.fn()} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/session",
      { cache: "no-store" },
    ));
    fetchMock.mockClear();

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email address.");
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(response({ status: "accepted" }, 202));
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: " OWNER@EXAMPLE.COM " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }));

    expect(await screen.findByLabelText("Email sign-in code")).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.eqourse.test/api/v1/auth/otp/request",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "owner@example.com" }),
      }),
    );
  });

  it("verifies through the same-origin handler and returns a vendor to its saved registration", async () => {
    const navigate = vi.fn();
    fetchMock.mockImplementation((path) => {
      if (path === "/api/auth/session") return Promise.resolve(response(session));
      if (path === "/api/v1/vendors/me") return Promise.resolve(response({ state: "SUBMITTED" }));
      if (path === "/api/v1/clients/me") return Promise.resolve(response({}, 404));
      return Promise.resolve(response({}, 401));
    });

    render(<LoginForm navigate={navigate} />);

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/register/vendor"));
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/vendors/me", { cache: "no-store" });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/clients/me", { cache: "no-store" });
  });

  it("completes OTP sign-in without exposing tokens and returns a client to its saved registration", async () => {
    const navigate = vi.fn();
    fetchMock.mockImplementation((path) => {
      if (String(path).endsWith("/api/v1/auth/otp/request")) {
        return Promise.resolve(response({ status: "accepted" }, 202));
      }
      if (path === "/api/auth/otp/verify") return Promise.resolve(response({ ok: true }));
      if (path === "/api/auth/session") {
        const sessionCalls = fetchMock.mock.calls.filter(([calledPath]) => calledPath === path);
        return Promise.resolve(sessionCalls.length === 1 ? response({}, 401) : response(session));
      }
      if (path === "/api/v1/vendors/me") return Promise.resolve(response({}, 404));
      if (path === "/api/v1/clients/me") return Promise.resolve(response({ state: "MORE_INFO_NEEDED" }));
      return Promise.resolve(response({}, 500));
    });

    render(<LoginForm navigate={navigate} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/auth/session", { cache: "no-store" }));
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }));
    fireEvent.change(await screen.findByLabelText("Email sign-in code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/register/client"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/otp/verify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "owner@example.com", otp: "123456" }),
      }),
    );
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/accessToken|refreshToken/);
  });
});
