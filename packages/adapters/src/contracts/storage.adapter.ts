export interface StorageAdapter<TRequest = unknown, TResponse = unknown> {
  createSignedUrl(request: TRequest): Promise<TResponse>;
}
