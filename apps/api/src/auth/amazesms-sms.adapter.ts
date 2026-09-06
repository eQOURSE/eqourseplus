import {
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  SandboxSmsAdapter,
  type SmsAdapter,
  type SmsOtpDelivery,
} from "@eqourse/adapters";

export const AMAZESMS_PUSH_ENDPOINT = "https://amazesms.in/api/pushsms";
export const AMAZESMS_REQUEST_TIMEOUT_MILLISECONDS = 5_000;

type SmsEnvironment = Record<string, string | undefined>;

export class AmazeSmsAdapter implements SmsAdapter {
  private readonly logger = new Logger(AmazeSmsAdapter.name);

  constructor(
    private readonly user: string,
    private readonly authKey: string,
    private readonly sender: string,
    private readonly entityId: string,
    private readonly templateId: string,
    private readonly messageTemplate: string,
    private readonly timeoutMilliseconds = AMAZESMS_REQUEST_TIMEOUT_MILLISECONDS,
  ) {}

  async sendOtp(delivery: SmsOtpDelivery): Promise<void> {
    const requestUrl = new URL(AMAZESMS_PUSH_ENDPOINT);
    requestUrl.search = new URLSearchParams({
      user: this.user,
      authkey: this.authKey,
      sender: this.sender,
      mobile: delivery.to,
      text: this.messageTemplate.replace("{code}", delivery.code),
      entityid: this.entityId,
      templateid: this.templateId,
      rpt: "1",
    }).toString();

    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        signal: AbortSignal.timeout(this.timeoutMilliseconds),
      });

      if (!response.ok) {
        this.logger.error({
          event: "amazesms_http_failure",
          httpStatusCode: response.status,
        });
        throw this.deliveryUnavailable();
      }

      const providerResponse = await response.text();
      const providerStatusCode = this.readProviderStatus(providerResponse);
      if (providerStatusCode === 100 || providerStatusCode === 150) return;

      if (providerStatusCode === undefined) {
        this.logger.error({ event: "amazesms_invalid_response" });
      } else {
        this.logger.error({
          event: "amazesms_delivery_rejected",
          providerStatusCode,
        });
      }
      throw this.deliveryUnavailable();
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error({ event: "amazesms_transport_failure" });
      throw this.deliveryUnavailable();
    }
  }

  private readProviderStatus(response: string): number | undefined {
    const match = response.trim().match(/^(\d{3})(?:\D|$)/);
    return match?.[1] ? Number(match[1]) : undefined;
  }

  private deliveryUnavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException({
      statusCode: 503,
      error: "Service Unavailable",
      code: "SMS_DELIVERY_UNAVAILABLE",
      message: "SMS delivery is temporarily unavailable",
    });
  }
}

export function createSmsAdapter(environment: SmsEnvironment): SmsAdapter {
  const provider = environment.SMS_PROVIDER?.trim() || "sandbox";
  if (provider === "sandbox") {
    return new SandboxSmsAdapter(async () => undefined);
  }
  if (provider !== "amazesms") {
    throw new Error("SMS_PROVIDER must be sandbox or amazesms");
  }

  const user = requiredConfig(environment, "AMAZESMS_USER");
  const authKey = requiredConfig(environment, "AMAZESMS_AUTHKEY");
  const sender = requiredConfig(environment, "AMAZESMS_SENDER");
  const entityId = requiredConfig(environment, "AMAZESMS_ENTITY_ID");
  const templateId = requiredConfig(environment, "AMAZESMS_TEMPLATE_ID");
  const messageTemplate = environment.SMS_OTP_TEMPLATE;
  if (!messageTemplate?.trim()) {
    throw new Error("SMS_OTP_TEMPLATE is required for AmazeSMS delivery");
  }
  if (messageTemplate.split("{code}").length !== 2) {
    throw new Error("SMS_OTP_TEMPLATE must contain exactly one {code} placeholder");
  }

  return new AmazeSmsAdapter(
    user,
    authKey,
    sender,
    entityId,
    templateId,
    messageTemplate,
  );
}

function requiredConfig(environment: SmsEnvironment, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required for AmazeSMS delivery`);
  return value;
}
