import { ServiceUnavailableException } from "@nestjs/common";
import { SandboxMailerAdapter } from "@eqourse/adapters";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createMailerAdapter,
  RESEND_EMAILS_ENDPOINT,
  RESEND_REQUEST_TIMEOUT_MILLISECONDS,
  ResendMailerAdapter,
} from "../src/auth/resend-mailer.adapter";

const delivery = {
  to: "freelancer@example.com",
  code: "123456",
  expiresAt: new Date("2026-09-05T12:10:00.000Z"),
};

describe("FR-FND-02 Resend mailer adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the sandbox adapter as the credential-free default", () => {
    expect(createMailerAdapter({})).toBeInstanceOf(SandboxMailerAdapter);
    expect(
      createMailerAdapter({
        MAILER_PROVIDER: "sandbox",
        RESEND_API_KEY: "unused-key",
        OTP_EMAIL_FROM: "unused@example.com",
      }),
    ).toBeInstanceOf(SandboxMailerAdapter);
  });

  it("selects Resend only when explicitly configured with both credentials", () => {
    expect(
      createMailerAdapter({
        MAILER_PROVIDER: "resend",
        RESEND_API_KEY: "resend-test-key",
        OTP_EMAIL_FROM: "eQOURSE+ <otp@example.com>",
      }),
    ).toBeInstanceOf(ResendMailerAdapter);

    expect(() =>
      createMailerAdapter({ MAILER_PROVIDER: "resend" }),
    ).toThrow(/RESEND_API_KEY/);
  });

  it("sends exactly one authorized request containing the recipient, code and expiry", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const adapter = new ResendMailerAdapter(
      "resend-test-key",
      "eQOURSE+ <otp@example.com>",
    );

    await adapter.sendOtp(delivery);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(RESEND_EMAILS_ENDPOINT);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer resend-test-key",
      "Content-Type": "application/json",
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(String(init?.body))).toMatchObject({
      from: "eQOURSE+ <otp@example.com>",
      to: [delivery.to],
      subject: "Your eQOURSE+ verification code",
    });
    const text = String(JSON.parse(String(init?.body)).text);
    expect(text).toContain(delivery.code);
    expect(text).toContain(delivery.expiresAt.toISOString());
    expect(text).toContain("If you did not request this code, you can ignore this email.");
    expect(RESEND_REQUEST_TIMEOUT_MILLISECONDS).toBe(5_000);
  });

  it.each([400, 429, 500, 503])(
    "surfaces a sanitized 503 for a Resend HTTP %s response",
    async (status) => {
      const providerBody = `provider rejected ${delivery.code}`;
      vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>().mockResolvedValue(
          new Response(providerBody, { status }),
        ),
      );
      const apiKey = "resend-secret-test-key";
      const adapter = new ResendMailerAdapter(apiKey, "otp@example.com");

      const error = await adapter.sendOtp(delivery).catch((reason: unknown) => reason);

      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getStatus()).toBe(503);
      const serialized = JSON.stringify({
        message: (error as Error).message,
        response: (error as ServiceUnavailableException).getResponse(),
      });
      expect(serialized).not.toContain(delivery.code);
      expect(serialized).not.toContain(apiKey);
      expect(serialized).not.toContain(providerBody);
    },
  );

  it("times out with the same sanitized 503 instead of hanging", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation((_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("request aborted", "AbortError"));
          });
        }),
      ),
    );
    const adapter = new ResendMailerAdapter(
      "resend-secret-test-key",
      "otp@example.com",
      10,
    );

    await expect(adapter.sendOtp(delivery)).rejects.toMatchObject({
      status: 503,
    });
  });

  it("never writes the OTP or API key at any log level", async () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map(
      (level) => vi.spyOn(console, level).mockImplementation(() => undefined),
    );
    const apiKey = "resend-secret-test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockRejectedValue(
        new Error(`provider failure ${apiKey} ${delivery.code}`),
      ),
    );
    const adapter = new ResendMailerAdapter(apiKey, "otp@example.com");

    await expect(adapter.sendOtp(delivery)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );

    const logOutput = JSON.stringify(spies.flatMap((spy) => spy.mock.calls));
    expect(logOutput).not.toContain(delivery.code);
    expect(logOutput).not.toContain(apiKey);
  });
});
