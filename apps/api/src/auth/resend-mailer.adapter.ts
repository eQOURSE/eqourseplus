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
  ) {}

  async sendOtp(delivery: OtpDelivery): Promise<void> {
    try {
      const response = await fetch(RESEND_EMAILS_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: [delivery.to],
          subject: "Your eQOURSE+ verification code",
          template: {
            id: "email-verification",
            variables: {
              otp: delivery.code,
              expiry: delivery.expiresAt.toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            },
          },
        }),
        signal: AbortSignal.timeout(this.timeoutMilliseconds),
      });

      if (!response.ok) throw this.deliveryUnavailable();
    } catch {
      throw this.deliveryUnavailable();
    }
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
  return new ResendMailerAdapter(apiKey, from);
}
