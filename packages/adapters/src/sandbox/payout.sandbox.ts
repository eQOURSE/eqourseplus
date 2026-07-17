import type { PayoutAdapter } from "../contracts/payout.adapter";
import type { AdapterResolver } from "../contracts/resolver";

export class SandboxPayoutAdapter<TRequest = unknown, TResponse = unknown>
  implements PayoutAdapter<TRequest, TResponse>
{
  constructor(private readonly resolver: AdapterResolver<TRequest, TResponse>) {}

  createPayout(request: TRequest): Promise<TResponse> {
    return Promise.resolve(this.resolver(request));
  }
}
