import type { SmsAdapter, SmsOtpDelivery } from "../contracts/sms.adapter";
import type { AdapterResolver } from "../contracts/resolver";

export class SandboxSmsAdapter<
  TRequest extends object = SmsOtpDelivery,
  TResponse = void,
> implements SmsAdapter<TRequest, TResponse>
{
  readonly deliveries: TRequest[] = [];

  constructor(private readonly resolver: AdapterResolver<TRequest, TResponse>) {}

  sendOtp(delivery: TRequest): Promise<TResponse> {
    this.deliveries.push({ ...delivery });
    return Promise.resolve(this.resolver(delivery));
  }
}
