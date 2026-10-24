import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));
vi.mock("../../api/auth/_lib/session-transport", () => ({
  ACCESS_COOKIE: "__Host-eqourse-access",
  readSession: vi.fn(),
}));

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession } from "../../api/auth/_lib/session-transport";
import ObservabilityCheckPage, { metadata } from "./page";

const session = {
  userId: "internal-user",
  email: "internal@example.com",
  roleAssignments: [{ role: "SUPER_ADMIN", businessUnit: "EQOURSE" }],
  profileState: "APPROVED",
} as const;

describe("FR-FND-06 web observability check", () => {
  it("is noindex and server-rendered", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(ObservabilityCheckPage.constructor.name).toBe("AsyncFunction");
  });

  it("rejects a missing authenticated session", async () => {
    vi.mocked(cookies).mockReturnValue({
      get: vi.fn(() => undefined),
    } as never);
    vi.mocked(readSession).mockResolvedValue(new Response(null, { status: 401 }));

    await ObservabilityCheckPage();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("throws only after the internal role is authenticated", async () => {
    vi.mocked(cookies).mockReturnValue({
      get: vi.fn(() => ({ value: "access-token" })),
    } as never);
    vi.mocked(readSession).mockResolvedValue(
      new Response(JSON.stringify(session), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(ObservabilityCheckPage()).rejects.toThrow(
      "FR-FND-06 deliberate web observability check",
    );
  });

  it("does not expose the check to an authenticated non-internal role", async () => {
    vi.mocked(cookies).mockReturnValue({
      get: vi.fn(() => ({ value: "access-token" })),
    } as never);
    vi.mocked(readSession).mockResolvedValue(
      new Response(JSON.stringify({
        ...session,
        roleAssignments: [{ role: "FREELANCER", businessUnit: "EQOURSE" }],
      }), { status: 200 }),
    );

    await ObservabilityCheckPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
