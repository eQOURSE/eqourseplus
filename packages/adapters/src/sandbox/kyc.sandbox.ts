import type { KYCAdapter } from "../contracts/kyc.adapter";
import type { AdapterResolver } from "../contracts/resolver";

export class SandboxKYCAdapter<TRequest = unknown, TResponse = unknown>
  implements KYCAdapter<TRequest, TResponse>
{
  constructor(private readonly resolver: AdapterResolver<TRequest, TResponse>) {}

  verify(request: TRequest): Promise<TResponse> {
    return Promise.resolve(this.resolver(request));
  }
}
