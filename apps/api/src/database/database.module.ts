import { Global, Module } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { connection } from "mongoose";

import { DatabaseConnectionService } from "./database-connection.service";

@Global()
@Module({
  providers: [
    DatabaseConnectionService,
    {
      provide: getConnectionToken(),
      useValue: connection,
    },
  ],
  exports: [DatabaseConnectionService, getConnectionToken()],
})
export class DatabaseModule {}
