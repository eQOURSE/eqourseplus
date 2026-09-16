import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { createStorageAdapter } from "../company-registration/r2-storage.adapter";
import { ClientController } from "./client.controller";
import { loadClientIdentifierHmacSecret } from "./client-identifier-digest";
import {
  CLIENT_IDENTIFIER_HMAC_SECRET,
  CLIENT_MODEL_NAME,
  CLIENT_STORAGE_ADAPTER,
  CLIENT_STORE,
} from "./client.constants";
import { clientSchema } from "./client.schema";
import { ClientService } from "./client.service";
import { MongooseClientStore } from "./client.store";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CLIENT_MODEL_NAME, schema: clientSchema }]),
  ],
  controllers: [ClientController],
  providers: [
    ClientService,
    MongooseClientStore,
    { provide: CLIENT_STORE, useExisting: MongooseClientStore },
    {
      provide: CLIENT_IDENTIFIER_HMAC_SECRET,
      useFactory: () => loadClientIdentifierHmacSecret(process.env),
    },
    {
      provide: CLIENT_STORAGE_ADAPTER,
      useFactory: () => createStorageAdapter(process.env),
    },
  ],
})
export class ClientsModule {}
