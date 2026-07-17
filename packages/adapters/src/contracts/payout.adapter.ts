export interface PayoutAdapter<TRequest = unknown, TResponse = unknown> {
  createPayout(request: TRequest): Promise<TResponse>;
}
