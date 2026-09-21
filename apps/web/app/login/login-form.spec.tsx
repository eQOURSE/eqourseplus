import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { captureMessage } = vi.hoisted(() => ({
  captureMessage: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage,
}));

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
  captureMessage.mockReset();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(response({}, 401));
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.eqourse.test/");
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function submitEmail(email = "owner@example.com"): Promise<void> {
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }));
  await screen.findByLabelText("Email sign-in code");
}

async function submitCode(code = "123456"): Promise<void> {
  fireEvent.change(screen.getByLabelText("Email sign-in code"), {
    target: { value: code },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("FR-REG-02C login form", () => {
  it("validates email and requests the OTP directly at the configured public API origin", async () => {
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
    await submitEmail(" OWNER@EXAMPLE.COM ");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.eqourse.test/api/v1/auth/otp/request",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "owner@example.com" }),
      }),
    );
  });

  it("does not relabel missing deployed API configuration as an OTP delivery failure", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");

    render(<LoginForm navigate={vi.fn()} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/session",
      { cache: "no-store" },
    ));
    fetchMock.mockClear();

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "owner@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(
      "We couldn’t send a sign-in code. Please wait a moment and try again.",
    )).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sign-in is unavailable because this deployment is missing API configuration.",
    );
    expect(screen.getByRole("button", { name: "Send sign-in code" })).toBeEnabled();
  });

  it.each([
    ["vendor", true, false, "/register/vendor"],
    ["client", false, true, "/register/client"],
    ["account with no company", false, false, "/register"],
  ])("completes OTP sign-in for a %s owner and routes by ownership", async (_, ownsVendor, ownsClient, destination) => {
    const navigate = vi.fn();
    let sessionReads = 0;
    fetchMock.mockImplementation((path) => {
      if (String(path).endsWith("/api/v1/auth/otp/request")) {
        return Promise.resolve(response({ status: "accepted" }, 202));
      }
      if (path === "/api/auth/otp/verify") return Promise.resolve(response({ status: "authenticated" }));
      if (path === "/api/auth/session") {
        sessionReads += 1;
        const returnedSession = destination === "/register"
          ? {
              ...session,
              roleAssignments: [{ role: "VENDOR", businessUnit: "EQOURSE" }],
            }
          : session;
        return Promise.resolve(sessionReads === 1 ? response({}, 401) : response(returnedSession));
      }
      if (path === "/api/v1/vendors/me") return Promise.resolve(response({}, ownsVendor ? 200 : 404));
      if (path === "/api/v1/clients/me") return Promise.resolve(response({}, ownsClient ? 200 : 404));
      return Promise.resolve(response({}, 500));
    });

    render(<LoginForm navigate={navigate} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/auth/session", { cache: "no-store" }));
    await submitEmail();
    await submitCode();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith(destination));
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/vendors/me", { cache: "no-store" });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/clients/me", { cache: "no-store" });
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/accessToken|refreshToken/);
  });

  it.each(["EQOURSE", "TUTRAIN"])(
    "routes a %s Verifier with no company to the company-review console after OTP verification",
    async (businessUnit) => {
      const navigate = vi.fn();
      let sessionReads = 0;
      fetchMock.mockImplementation((path) => {
        if (String(path).endsWith("/api/v1/auth/otp/request")) {
          return Promise.resolve(response({ status: "accepted" }, 202));
        }
        if (path === "/api/auth/otp/verify") {
          return Promise.resolve(response({ status: "authenticated" }));
        }
        if (path === "/api/auth/session") {
          sessionReads += 1;
          return Promise.resolve(sessionReads === 1
            ? response({}, 401)
            : response({
                ...session,
                roleAssignments: [{ role: "VERIFIER", businessUnit }],
              }));
        }
        if (path === "/api/v1/vendors/me" || path === "/api/v1/clients/me") {
          return Promise.resolve(response({}, 404));
        }
        return Promise.resolve(response({}, 500));
      });

      render(<LoginForm navigate={navigate} />);
      await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/session",
        { cache: "no-store" },
      ));
      await submitEmail();
      await submitCode();

      await waitFor(() => expect(navigate).toHaveBeenCalledWith("/company-reviews"));
    },
  );

  it("keeps company ownership ahead of an internal-surface role", async () => {
    const navigate = vi.fn();
    let sessionReads = 0;
    fetchMock.mockImplementation((path) => {
      if (String(path).endsWith("/api/v1/auth/otp/request")) {
        return Promise.resolve(response({ status: "accepted" }, 202));
      }
      if (path === "/api/auth/otp/verify") {
        return Promise.resolve(response({ status: "authenticated" }));
      }
      if (path === "/api/auth/session") {
        sessionReads += 1;
        return Promise.resolve(sessionReads === 1
          ? response({}, 401)
          : response({
              ...session,
              roleAssignments: [{ role: "VERIFIER", businessUnit: "EQOURSE" }],
            }));
      }
      if (path === "/api/v1/vendors/me") return Promise.resolve(response({}));
      if (path === "/api/v1/clients/me") return Promise.resolve(response({}, 404));
      return Promise.resolve(response({}, 500));
    });

    render(<LoginForm navigate={navigate} />);
    await submitEmail();
    await submitCode();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/register/vendor"));
  });

  it.each([
    ["role", { role: "NEW_INTERNAL_ROLE", businessUnit: "EQOURSE" }, "NEW_INTERNAL_ROLE"],
    ["business unit", { role: "VERIFIER", businessUnit: "NEW_UNIT" }, "NEW_UNIT"],
  ])(
    "drops an assignment with an unknown %s, warns Sentry, and routes to registration",
    async (_, unknownAssignment, unknownValue) => {
      const navigate = vi.fn();
      fetchMock.mockImplementation((path) => {
        if (path === "/api/auth/session") {
          return Promise.resolve(response({
            ...session,
            roleAssignments: [unknownAssignment],
          }));
        }
        if (path === "/api/v1/vendors/me" || path === "/api/v1/clients/me") {
          return Promise.resolve(response({}, 404));
        }
        return Promise.resolve(response({}, 500));
      });

      render(<LoginForm navigate={navigate} />);

      await waitFor(() => expect(navigate).toHaveBeenCalledWith("/register"));
      expect(captureMessage).toHaveBeenCalledWith(
        expect.stringContaining(unknownValue),
        "warning",
      );
    },
  );

  it.each([
    ["a missing userId", { email: session.email, roleAssignments: [], profileState: "DRAFT" }],
    ["a malformed email", { ...session, email: "not-an-email" }],
    ["an unknown top-level key", { ...session, unexpected: true }],
  ])("keeps rejecting a session with %s", async (_, malformedSession) => {
    const navigate = vi.fn();
    fetchMock.mockResolvedValue(response(malformedSession));

    render(<LoginForm navigate={navigate} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/session",
      { cache: "no-store" },
    ));
    expect(navigate).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([400, 401])("uses one wrong-or-expired message when verification returns %s", async (status) => {
    fetchMock.mockImplementation((path) => {
      if (String(path).endsWith("/api/v1/auth/otp/request")) {
        return Promise.resolve(response({ status: "accepted" }, 202));
      }
      if (path === "/api/auth/otp/verify") return Promise.resolve(response({}, status));
      return Promise.resolve(response({}, 401));
    });

    render(<LoginForm navigate={vi.fn()} />);
    await submitEmail();
    await submitCode();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That code is invalid or has expired. Request a new code and try again.",
    );
  });

  it.each(["known@example.com", "unknown@example.com"])(
    "shows the same accepted outcome after requesting a code for %s",
    async (email) => {
      fetchMock.mockImplementation((path) =>
        String(path).endsWith("/api/v1/auth/otp/request")
          ? Promise.resolve(response({ status: "accepted" }, 202))
          : Promise.resolve(response({}, 401)),
      );

      render(<LoginForm navigate={vi.fn()} />);
      await submitEmail(email);

      expect(screen.getByText(/If an account uses/)).toBeVisible();
      expect(screen.getByText(/a six-digit code was sent there/)).toBeVisible();
    },
  );
});
