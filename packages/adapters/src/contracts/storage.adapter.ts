export interface SignedUploadRequest {
  objectKey: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds: number;
}

export interface SignedUpload {
  url: string;
}

export interface StorageAdapter<
  TRequest = SignedUploadRequest,
  TResponse = SignedUpload,
> {
  createSignedUrl(request: TRequest): Promise<TResponse>;
}
