import { Test } from "@nestjs/testing";
import { afterEach, describe, expect, it } from "vitest";

import { DatabaseConnectionService } from "../src/database/database-connection.service";
import { DatabaseModule } from "../src/database/database.module";
import { VendorsModule } from "../src/vendors/vendors.module";

describe("FR-REG-08A vendor configuration", () => {
  afterEach(() => {
    delete process.env.VENDOR_IDENTIFIER_HMAC_SECRET;
  });

  it("fails module initialization when the vendor HMAC secret is missing", async () => {
    delete process.env.VENDOR_IDENTIFIER_HMAC_SECRET;

    await expect(
      Test.createTestingModule({ imports: [DatabaseModule, VendorsModule] })
        .overrideProvider(DatabaseConnectionService)
        .useValue({})
        .compile(),
    ).rejects.toThrow("VENDOR_IDENTIFIER_HMAC_SECRET is required");
  });
});
