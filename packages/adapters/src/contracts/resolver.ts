export type AdapterResolver<TRequest, TResponse> = (
  request: TRequest,
) => Promise<TResponse> | TResponse;
