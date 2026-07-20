import type { MailerAdapter, OtpDelivery } from "../contracts/mailer.adapter";

export class SandboxMailerAdapter implements MailerAdapter {
  readonly deliveries: OtpDelivery[] = [];

  async sendOtp(delivery: OtpDelivery): Promise<void> {
    this.deliveries.push({ ...delivery });
  }
}
