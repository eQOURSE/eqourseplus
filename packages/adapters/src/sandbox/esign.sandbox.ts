import type { ESignAdapter } from "../contracts/esign.adapter";
import type { AdapterResolver } from "../contracts/resolver";

export class SandboxESignAdapter<TRequest = unknown, TResponse = unknown>
  implements ESignAdapter<TRequest, TResponse>
{
  constructor(private readonly resolver: AdapterResolver<TRequest, TResponse>) {}

  createSignatureRequest(request: TRequest): Promise<TResponse> {
    return Promise.resolve(this.resolver(request));
  }
}
