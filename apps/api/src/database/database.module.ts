import { Global, Module } from "@nestjs/common";

import { DatabaseConnectionService } from "./database-connection.service";

@Global()
@Module({
  providers: [DatabaseConnectionService],
  exports: [DatabaseConnectionService],
})
export class DatabaseModule {}
