export interface SignedUploadRequest {
  objectKey: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds: number;
}

export interface SignedUpload {
  url: string;
}

export interface SignedGetRequest {
  objectKey: string;
  expiresInSeconds: number;
}

export interface SignedGet {
  url: string;
}

export interface StorageAdapter<
  TRequest = SignedUploadRequest,
  TResponse = SignedUpload,
> {
  createSignedUrl(request: TRequest): Promise<TResponse>;
  objectExists(objectKey: string): Promise<boolean>;
  createSignedGetUrl(request: SignedGetRequest): Promise<SignedGet>;
}
