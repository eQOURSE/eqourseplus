import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  SandboxStorageAdapter,
  type SignedUpload,
  type SignedUploadRequest,
  type SignedGet,
  type SignedGetRequest,
  type StorageAdapter,
} from "@eqourse/adapters";

type StorageEnvironment = Record<string, string | undefined>;
type Presign = typeof getSignedUrl;

interface R2StorageConfig {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export class R2StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;

  constructor(
    private readonly config: R2StorageConfig,
    private readonly presign: Presign = getSignedUrl,
  ) {
    this.client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async createSignedUrl(request: SignedUploadRequest): Promise<SignedUpload> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: request.objectKey,
      ContentType: request.contentType,
      ContentLength: request.contentLength,
    });
    const url = await this.presign(this.client, command, {
      expiresIn: request.expiresInSeconds,
      signableHeaders: new Set(["content-length", "content-type"]),
    });
    return { url };
  }

  async objectExists(objectKey: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: objectKey,
        }),
      );
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === "NotFound" ||
          (error as Error & { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode === 404)
      ) {
        return false;
      }
      throw error;
    }
  }

  async createSignedGetUrl(request: SignedGetRequest): Promise<SignedGet> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: request.objectKey,
    });
    return {
      url: await this.presign(this.client, command, {
        expiresIn: request.expiresInSeconds,
      }),
    };
  }
}

export function createStorageAdapter(
  environment: StorageEnvironment,
): StorageAdapter {
  const provider = environment.STORAGE_PROVIDER?.trim() || "sandbox";
  if (provider === "sandbox") {
    return new SandboxStorageAdapter((request: SignedUploadRequest) => ({
      url: `https://storage.invalid/${encodeURIComponent(request.objectKey)}`,
    }));
  }
  if (provider !== "r2") {
    throw new Error("STORAGE_PROVIDER must be sandbox or r2");
  }

  const endpoint = required(environment, "R2_ENDPOINT");
  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      throw new Error();
    }
  } catch {
    throw new Error("R2_ENDPOINT must be a credential-free HTTPS URL");
  }

  return new R2StorageAdapter({
    endpoint: endpoint.replace(/\/+$/, ""),
    bucket: required(environment, "R2_BUCKET"),
    accessKeyId: required(environment, "R2_ACCESS_KEY_ID"),
    secretAccessKey: required(environment, "R2_SECRET_ACCESS_KEY"),
  });
}

function required(environment: StorageEnvironment, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required for R2 storage`);
  return value;
}
