import { Test } from "@nestjs/testing";
import { afterEach, describe, expect, it } from "vitest";

import { ClientsModule } from "../src/clients/clients.module";
import { DatabaseConnectionService } from "../src/database/database-connection.service";
import { DatabaseModule } from "../src/database/database.module";

describe("FR-REG-15 client configuration", () => {
  afterEach(() => {
    delete process.env.CLIENT_IDENTIFIER_HMAC_SECRET;
  });

  it("fails module initialization when the client HMAC secret is missing", async () => {
    delete process.env.CLIENT_IDENTIFIER_HMAC_SECRET;
    await expect(
      Test.createTestingModule({ imports: [DatabaseModule, ClientsModule] })
        .overrideProvider(DatabaseConnectionService)
        .useValue({})
        .compile(),
    ).rejects.toThrow("CLIENT_IDENTIFIER_HMAC_SECRET is required");
  });
});
