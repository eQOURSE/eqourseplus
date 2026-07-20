import { describe, expect, it, vi } from "vitest";

import {
  SandboxMailerAdapter,
  SandboxESignAdapter,
  SandboxKYCAdapter,
  SandboxLLMAdapter,
  SandboxPayoutAdapter,
  SandboxProctorAdapter,
  SandboxStorageAdapter,
} from "../src";

describe("FR-FND-02 sandbox mailer adapter", () => {
  it("captures OTP deliveries without making a network call", async () => {
    const mailer = new SandboxMailerAdapter();

    await mailer.sendOtp({
      to: "user@example.com",
      code: "123456",
      expiresAt: new Date("2026-07-20T10:10:00.000Z"),
    });

    expect(mailer.deliveries).toEqual([
      {
        to: "user@example.com",
        code: "123456",
        expiresAt: new Date("2026-07-20T10:10:00.000Z"),
      },
    ]);
  });
});

describe("FR-FND-01 sandbox adapters", () => {
  it.each([
    ["KYC", SandboxKYCAdapter, "verify"],
    ["e-sign", SandboxESignAdapter, "createSignatureRequest"],
    ["payout", SandboxPayoutAdapter, "createPayout"],
    ["proctor", SandboxProctorAdapter, "startSession"],
    ["storage", SandboxStorageAdapter, "createSignedUrl"],
    ["LLM", SandboxLLMAdapter, "generate"],
  ] as const)("uses an injected deterministic resolver for %s", async (_, Adapter, method) => {
    const resolver = vi.fn(async (request: { id: string }) => ({
      requestId: request.id,
      sandbox: true,
    }));
    const adapter = new Adapter(resolver);

    await expect(adapter[method]({ id: "req-1" })).resolves.toEqual({
      requestId: "req-1",
      sandbox: true,
    });
    expect(resolver).toHaveBeenCalledOnce();
  });
});
