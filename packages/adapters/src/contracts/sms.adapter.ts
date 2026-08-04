export interface SmsOtpDelivery {
  to: string;
  code: string;
  expiresAt: Date;
}

export interface SmsAdapter<
  TRequest extends object = SmsOtpDelivery,
  TResponse = void,
> {
  sendOtp(delivery: TRequest): Promise<TResponse>;
}
