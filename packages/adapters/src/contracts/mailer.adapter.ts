export interface OtpDelivery {
  to: string;
  code: string;
  expiresAt: Date;
}

export interface MailerAdapter {
  sendOtp(delivery: OtpDelivery): Promise<void>;
}
