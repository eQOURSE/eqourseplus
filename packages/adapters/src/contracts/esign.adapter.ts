export interface ESignAdapter<TRequest = unknown, TResponse = unknown> {
  createSignatureRequest(request: TRequest): Promise<TResponse>;
}
