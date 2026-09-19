import type { AdapterResolver } from "../contracts/resolver";
import type {
  SignedGet,
  SignedGetRequest,
  StorageAdapter,
} from "../contracts/storage.adapter";

export class SandboxStorageAdapter<TRequest = unknown, TResponse = unknown>
  implements StorageAdapter<TRequest, TResponse>
{
  constructor(
    private readonly resolver: AdapterResolver<TRequest, TResponse>,
    private readonly existsResolver: (objectKey: string) => boolean = () => false,
    private readonly getResolver: AdapterResolver<SignedGetRequest, SignedGet> = (
      request,
    ) => ({
      url: `https://storage.invalid/${encodeURIComponent(request.objectKey)}`,
    }),
  ) {}

  createSignedUrl(request: TRequest): Promise<TResponse> {
    return Promise.resolve(this.resolver(request));
  }

  objectExists(objectKey: string): Promise<boolean> {
    return Promise.resolve(this.existsResolver(objectKey));
  }

  createSignedGetUrl(request: SignedGetRequest): Promise<SignedGet> {
    return Promise.resolve(this.getResolver(request));
  }
}
