import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

import { R2StorageAdapter } from "../src/company-registration/r2-storage.adapter";

const config = {
  endpoint: "https://account.r2.cloudflarestorage.com",
  bucket: "private-company-documents",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
};
const objectKey = "clients/507f1f77bcf86cd799439011/documents/INCORPORATION/file.pdf";

describe("FR-REG-07A private company document reads", () => {
  it("checks R2 object existence with HEAD and reports a missing object", async () => {
    const adapter = new R2StorageAdapter(config);
    const send = vi.spyOn(
      (adapter as unknown as { client: S3Client }).client,
      "send",
    ).mockRejectedValueOnce(Object.assign(new Error("missing"), { name: "NotFound" }));

    await expect(adapter.objectExists(objectKey)).resolves.toBe(false);
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadObjectCommand);
    expect((send.mock.calls[0]?.[0] as HeadObjectCommand).input).toEqual({
      Bucket: config.bucket,
      Key: objectKey,
    });
  });

  it("issues only a short-lived signed GET credential for a present private object", async () => {
    const signedUrl = "https://private.r2.example.test/file?X-Amz-Signature=credential";
    const presign = vi.fn().mockResolvedValue(signedUrl);
    const adapter = new R2StorageAdapter(config, presign);
    vi.spyOn(
      (adapter as unknown as { client: S3Client }).client,
      "send",
    ).mockResolvedValueOnce({} as never);

    await expect(adapter.objectExists(objectKey)).resolves.toBe(true);
    await expect(adapter.createSignedGetUrl({
      objectKey,
      expiresInSeconds: 300,
    })).resolves.toEqual({ url: signedUrl });
    expect(presign.mock.calls[0]?.[1]).toBeInstanceOf(GetObjectCommand);
    expect((presign.mock.calls[0]?.[1] as GetObjectCommand).input).toEqual({
      Bucket: config.bucket,
      Key: objectKey,
    });
    expect(presign.mock.calls[0]?.[2]).toEqual({ expiresIn: 300 });
  });
});
