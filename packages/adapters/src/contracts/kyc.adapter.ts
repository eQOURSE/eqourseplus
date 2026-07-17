export interface KYCAdapter<TRequest = unknown, TResponse = unknown> {
  verify(request: TRequest): Promise<TResponse>;
}
