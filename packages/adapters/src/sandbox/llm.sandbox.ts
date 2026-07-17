import type { LLMAdapter } from "../contracts/llm.adapter";
import type { AdapterResolver } from "../contracts/resolver";

export class SandboxLLMAdapter<TRequest = unknown, TResponse = unknown>
  implements LLMAdapter<TRequest, TResponse>
{
  constructor(private readonly resolver: AdapterResolver<TRequest, TResponse>) {}

  generate(request: TRequest): Promise<TResponse> {
    return Promise.resolve(this.resolver(request));
  }
}
