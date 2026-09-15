import { PutObjectCommand } from "@aws-sdk/client-s3";
import { SandboxStorageAdapter } from "@eqourse/adapters";
import { describe, expect, it, vi } from "vitest";

import {
  createStorageAdapter,
  R2StorageAdapter,
} from "../src/vendors/r2-storage.adapter";

const environment = {
  STORAGE_PROVIDER: "r2",
  R2_ENDPOINT:
    "https://50c49dfc680d966ef959aba266b04ea9.r2.cloudflarestorage.com",
  R2_BUCKET: "eqplus-staging-kyc-docs",
  R2_ACCESS_KEY_ID: "test-access-key",
  R2_SECRET_ACCESS_KEY: "test-secret-key",
};

describe("FR-REG-08A R2 storage adapter", () => {
  it("keeps sandbox as the credential-free default and selects R2 explicitly", () => {
    expect(createStorageAdapter({})).toBeInstanceOf(SandboxStorageAdapter);
    expect(createStorageAdapter(environment)).toBeInstanceOf(R2StorageAdapter);
  });

  it.each([
    "R2_ENDPOINT",
    "R2_BUCKET",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
  ] as const)("fails during provider creation when %s is absent", (name) => {
    expect(() =>
      createStorageAdapter({ ...environment, [name]: undefined }),
    ).toThrow(name);
  });

  it("rejects unsupported providers and credentialed or non-HTTPS endpoints", () => {
    expect(() => createStorageAdapter({ STORAGE_PROVIDER: "unknown" })).toThrow(
      /sandbox or r2/,
    );
    expect(() =>
      createStorageAdapter({ ...environment, R2_ENDPOINT: "http://r2.example.com" }),
    ).toThrow(/HTTPS/);
    expect(() =>
      createStorageAdapter({
        ...environment,
        R2_ENDPOINT: "https://user:password@r2.example.com",
      }),
    ).toThrow(/credential-free/);
  });

  it("signs PUT-only content type and exact content length for five minutes", async () => {
    const presign = vi.fn().mockResolvedValue(
      "https://r2.example.com/private?X-Amz-Signature=credential",
    );
    const adapter = new R2StorageAdapter(
      {
        endpoint: environment.R2_ENDPOINT,
        bucket: environment.R2_BUCKET,
        accessKeyId: environment.R2_ACCESS_KEY_ID,
        secretAccessKey: environment.R2_SECRET_ACCESS_KEY,
      },
      presign,
    );

    const result = await adapter.createSignedUrl({
      objectKey: "vendors/vendor-1/BANK_PROOF/random.pdf",
      contentType: "application/pdf",
      contentLength: 1024,
      expiresInSeconds: 300,
    });

    expect(result).toEqual({
      url: "https://r2.example.com/private?X-Amz-Signature=credential",
    });
    const command = presign.mock.calls[0]?.[1];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect((command as PutObjectCommand).input).toEqual({
      Bucket: environment.R2_BUCKET,
      Key: "vendors/vendor-1/BANK_PROOF/random.pdf",
      ContentType: "application/pdf",
      ContentLength: 1024,
    });
    expect(presign.mock.calls[0]?.[2]).toEqual({
      expiresIn: 300,
      signableHeaders: new Set(["content-length", "content-type"]),
    });
  });

  it("binds content length and content type in the actual SigV4 signed headers", async () => {
    const adapter = createStorageAdapter(environment);

    const { url } = await adapter.createSignedUrl({
      objectKey: "vendors/vendor-1/BANK_PROOF/random.pdf",
      contentType: "application/pdf",
      contentLength: 1024,
      expiresInSeconds: 300,
    });

    const signedUrl = new URL(url);
    expect(signedUrl.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(signedUrl.searchParams.get("X-Amz-SignedHeaders")?.split(";")).toEqual(
      expect.arrayContaining(["content-length", "content-type", "host"]),
    );
    expect(signedUrl.hostname).toBe(
      "eqplus-staging-kyc-docs.50c49dfc680d966ef959aba266b04ea9.r2.cloudflarestorage.com",
    );
    expect(signedUrl.pathname).toBe(
      "/vendors/vendor-1/BANK_PROOF/random.pdf",
    );
  });
});
