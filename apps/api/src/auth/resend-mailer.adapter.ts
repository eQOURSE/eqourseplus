import { ServiceUnavailableException } from "@nestjs/common";
import {
  SandboxMailerAdapter,
  type MailerAdapter,
  type OtpDelivery,
} from "@eqourse/adapters";

export const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";
export const RESEND_REQUEST_TIMEOUT_MILLISECONDS = 5_000;

type MailerEnvironment = Record<string, string | undefined>;

export class ResendMailerAdapter implements MailerAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly timeoutMilliseconds = RESEND_REQUEST_TIMEOUT_MILLISECONDS,
    private readonly templateId?: string,
  ) {}

  async sendOtp(delivery: OtpDelivery): Promise<void> {
    const text = [
      `Your eQOURSE+ verification code is ${delivery.code}.`,
      `It expires at ${delivery.expiresAt.toISOString()} (UTC).`,
      "If you did not request this code, you can ignore this email.",
    ].join("\n\n");

    if (this.templateId) {
      try {
        const templateResponse = await this.send({
          from: this.from,
          to: [delivery.to],
          subject: "Your eQOURSE+ verification code",
          template: {
            id: this.templateId,
            variables: { otp: delivery.code, expiry: delivery.expiresAt.toISOString() },
          },
        });
        if (templateResponse.ok) return;
      } catch {
        // Fall through to the self-contained text message.
      }
    }

    try {
      const fallbackResponse = await this.send({
        from: this.from,
        to: [delivery.to],
        subject: "Your eQOURSE+ verification code",
        text,
      });
      if (fallbackResponse.ok) return;
    } catch {
      // Convert provider and timeout failures to the adapter contract below.
    }

    throw this.deliveryUnavailable();
  }

  private send(body: Record<string, unknown>): Promise<Response> {
    return fetch(RESEND_EMAILS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMilliseconds),
    });
  }

  private deliveryUnavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException({
      statusCode: 503,
      error: "Service Unavailable",
      code: "EMAIL_DELIVERY_UNAVAILABLE",
      message: "Email delivery is temporarily unavailable",
    });
  }
}

export function createMailerAdapter(
  environment: MailerEnvironment,
): MailerAdapter {
  const provider = environment.MAILER_PROVIDER?.trim() || "sandbox";
  if (provider === "sandbox") return new SandboxMailerAdapter();
  if (provider !== "resend") {
    throw new Error("MAILER_PROVIDER must be sandbox or resend");
  }

  const apiKey = environment.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY is required for Resend email");
  const from = environment.OTP_EMAIL_FROM?.trim();
  if (!from) throw new Error("OTP_EMAIL_FROM is required for Resend email");
  return new ResendMailerAdapter(apiKey, from, RESEND_REQUEST_TIMEOUT_MILLISECONDS, environment.RESEND_EMAIL_TEMPLATE_ID?.trim() || undefined);
}
