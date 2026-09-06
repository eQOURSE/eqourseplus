import { Logger, ServiceUnavailableException } from "@nestjs/common";
import { SandboxSmsAdapter } from "@eqourse/adapters";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AMAZESMS_PUSH_ENDPOINT,
  AMAZESMS_REQUEST_TIMEOUT_MILLISECONDS,
  AmazeSmsAdapter,
  createSmsAdapter,
} from "../src/auth/amazesms-sms.adapter";

const delivery = {
  to: "+919876543210",
  code: "123456",
  expiresAt: new Date("2026-09-07T12:10:00.000Z"),
};
const smsTemplate =
  "{code} is your OTP/ verification code for Tutrain. Do not share this with anyone. Regards- Tutrain";
const configuredEnvironment = {
  SMS_PROVIDER: "amazesms",
  AMAZESMS_USER: "test-profile",
  AMAZESMS_AUTHKEY: "test-secret-auth-key",
  AMAZESMS_SENDER: "TUINFO",
  AMAZESMS_ENTITY_ID: "1001986749697154095",
  AMAZESMS_TEMPLATE_ID: "1707160000000000000",
  SMS_OTP_TEMPLATE: smsTemplate,
};

describe("FR-REG-01 AmazeSMS OTP adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the sandbox adapter as the credential-free default without fetching", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    const defaultAdapter = createSmsAdapter({});
    const explicitAdapter = createSmsAdapter({
      ...configuredEnvironment,
      SMS_PROVIDER: "sandbox",
    });

    expect(defaultAdapter).toBeInstanceOf(SandboxSmsAdapter);
    expect(explicitAdapter).toBeInstanceOf(SandboxSmsAdapter);
    await defaultAdapter.sendOtp(delivery);
    await explicitAdapter.sendOtp(delivery);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("selects AmazeSMS only when explicitly and completely configured", () => {
    expect(createSmsAdapter(configuredEnvironment)).toBeInstanceOf(
      AmazeSmsAdapter,
    );
    expect(() => createSmsAdapter({ SMS_PROVIDER: "other" })).toThrow(
      /SMS_PROVIDER must be sandbox or amazesms/,
    );
  });

  it.each([
    "AMAZESMS_USER",
    "AMAZESMS_AUTHKEY",
    "AMAZESMS_SENDER",
    "AMAZESMS_ENTITY_ID",
    "AMAZESMS_TEMPLATE_ID",
    "SMS_OTP_TEMPLATE",
] as const)("fails startup when %s is missing", (variable) => {
    expect(() =>
      createSmsAdapter({ ...configuredEnvironment, [variable]: "" }),
    ).toThrow(new RegExp(variable));
  });

  it.each([
    "This approved template has no code placeholder",
    "{code} appears twice: {code}",
  ])("requires exactly one {code} placeholder in the DLT template", (template) => {
    expect(() =>
      createSmsAdapter({
        ...configuredEnvironment,
        SMS_OTP_TEMPLATE: template,
      }),
    ).toThrow(/exactly one \{code\}/);
  });

  it("sends exactly one HTTPS request with the exact substituted and encoded DLT text", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("100|test-tracking-id", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createSmsAdapter(configuredEnvironment);

    await adapter.sendOtp(delivery);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [request, init] = fetchMock.mock.calls[0] ?? [];
    const url = new URL(String(request));
    const exactText = smsTemplate.replace("{code}", delivery.code);
    expect(url.origin + url.pathname).toBe(AMAZESMS_PUSH_ENDPOINT);
    expect(url.protocol).toBe("https:");
    expect(url.searchParams.get("user")).toBe(configuredEnvironment.AMAZESMS_USER);
    expect(url.searchParams.get("authkey")).toBe(
      configuredEnvironment.AMAZESMS_AUTHKEY,
    );
    expect(url.searchParams.get("sender")).toBe(
      configuredEnvironment.AMAZESMS_SENDER,
    );
    expect(url.searchParams.get("mobile")).toBe(delivery.to);
    expect(url.searchParams.get("entityid")).toBe(
      configuredEnvironment.AMAZESMS_ENTITY_ID,
    );
    expect(url.searchParams.get("templateid")).toBe(
      configuredEnvironment.AMAZESMS_TEMPLATE_ID,
    );
    expect(url.searchParams.get("text")).toBe(exactText);
    expect(url.search).toContain(
      "text=123456+is+your+OTP%2F+verification+code+for+Tutrain",
    );
    expect(init?.method).toBe("GET");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(AMAZESMS_REQUEST_TIMEOUT_MILLISECONDS).toBe(5_000);
  });

  it.each(["100|tracking-id", "150"])(
    "accepts provider success response %s",
    async (body) => {
      vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>().mockResolvedValue(
          new Response(body, { status: 200 }),
        ),
      );

      await expect(
        createSmsAdapter(configuredEnvironment).sendOtp(delivery),
      ).resolves.toBeUndefined();
    },
  );

  it.each([200, 250, 260, 350, 500, 600, 700, 255, 610, 999])(
    "surfaces a sanitized 503 and logs only provider status %s",
    async (providerStatus) => {
      const logSpy = vi
        .spyOn(Logger.prototype, "error")
        .mockImplementation(() => undefined);
      const rawProviderBody = `${providerStatus}|rejected ${delivery.code}`;
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
        new Response(rawProviderBody, { status: 200 }),
      );
      vi.stubGlobal("fetch", fetchMock);
      const adapter = createSmsAdapter(configuredEnvironment);

      const error = await adapter
        .sendOtp(delivery)
        .catch((reason: unknown) => reason);
      const [request] = fetchMock.mock.calls[0] ?? [];

      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getStatus()).toBe(503);
      const serializedError = JSON.stringify({
        message: (error as Error).message,
        response: (error as ServiceUnavailableException).getResponse(),
      });
      expect(serializedError).not.toContain(delivery.code);
      expect(serializedError).not.toContain(configuredEnvironment.AMAZESMS_AUTHKEY);
      expect(serializedError).not.toContain(delivery.to);
      expect(serializedError).not.toContain(rawProviderBody);

      const logOutput = JSON.stringify(logSpy.mock.calls);
      expect(logOutput).toContain(String(providerStatus));
      expect(logOutput).not.toContain(delivery.code);
      expect(logOutput).not.toContain(configuredEnvironment.AMAZESMS_AUTHKEY);
      expect(logOutput).not.toContain(delivery.to);
      expect(logOutput).not.toContain(String(request));
      expect(logOutput).not.toContain(rawProviderBody);
    },
  );

  it("maps a timeout to the same sanitized 503 without hanging", async () => {
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
    const adapter = new AmazeSmsAdapter(
      configuredEnvironment.AMAZESMS_USER,
      configuredEnvironment.AMAZESMS_AUTHKEY,
      configuredEnvironment.AMAZESMS_SENDER,
      configuredEnvironment.AMAZESMS_ENTITY_ID,
      configuredEnvironment.AMAZESMS_TEMPLATE_ID,
      configuredEnvironment.SMS_OTP_TEMPLATE,
      10,
    );

    await expect(adapter.sendOtp(delivery)).rejects.toMatchObject({
      status: 503,
    });
  });

  it("never logs secrets, PII, provider bodies, caught errors or the request URL", async () => {
    const loggerSpies = (["log", "warn", "error", "debug", "verbose"] as const).map(
      (level) => vi.spyOn(Logger.prototype, level).mockImplementation(() => undefined),
    );
    const consoleSpies = (["log", "info", "warn", "error", "debug"] as const).map(
      (level) => vi.spyOn(console, level).mockImplementation(() => undefined),
    );
    const caughtMessage = `network ${configuredEnvironment.AMAZESMS_AUTHKEY} ${delivery.code} ${delivery.to}`;
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error(caughtMessage));
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createSmsAdapter(configuredEnvironment);

    await expect(adapter.sendOtp(delivery)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );

    const [request] = fetchMock.mock.calls[0] ?? [];
    const logOutput = JSON.stringify(
      [...loggerSpies, ...consoleSpies].flatMap((spy) => spy.mock.calls),
    );
    expect(logOutput).not.toContain(delivery.code);
    expect(logOutput).not.toContain(configuredEnvironment.AMAZESMS_AUTHKEY);
    expect(logOutput).not.toContain(delivery.to);
    expect(logOutput).not.toContain(caughtMessage);
    expect(logOutput).not.toContain(String(request));
  });

  it("sanitizes non-2xx and malformed provider responses", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("100", { status: 500 }))
      .mockResolvedValueOnce(new Response("unexpected response", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createSmsAdapter(configuredEnvironment);

    await expect(adapter.sendOtp(delivery)).rejects.toMatchObject({ status: 503 });
    await expect(adapter.sendOtp(delivery)).rejects.toMatchObject({ status: 503 });
  });
});
