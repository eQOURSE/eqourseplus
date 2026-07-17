import type { ProctorAdapter } from "../contracts/proctor.adapter";
import type { AdapterResolver } from "../contracts/resolver";

export class SandboxProctorAdapter<TRequest = unknown, TResponse = unknown>
  implements ProctorAdapter<TRequest, TResponse>
{
  constructor(private readonly resolver: AdapterResolver<TRequest, TResponse>) {}

  startSession(request: TRequest): Promise<TResponse> {
    return Promise.resolve(this.resolver(request));
  }
}
