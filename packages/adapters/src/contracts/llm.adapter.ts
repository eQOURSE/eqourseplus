export interface LLMAdapter<TRequest = unknown, TResponse = unknown> {
  generate(request: TRequest): Promise<TResponse>;
}
