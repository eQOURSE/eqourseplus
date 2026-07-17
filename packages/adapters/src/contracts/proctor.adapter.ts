export interface ProctorAdapter<TRequest = unknown, TResponse = unknown> {
  startSession(request: TRequest): Promise<TResponse>;
}
