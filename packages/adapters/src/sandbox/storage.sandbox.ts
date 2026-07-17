import type { AdapterResolver } from "../contracts/resolver";
import type { StorageAdapter } from "../contracts/storage.adapter";

export class SandboxStorageAdapter<TRequest = unknown, TResponse = unknown>
  implements StorageAdapter<TRequest, TResponse>
{
  constructor(private readonly resolver: AdapterResolver<TRequest, TResponse>) {}

  createSignedUrl(request: TRequest): Promise<TResponse> {
    return Promise.resolve(this.resolver(request));
  }
}
