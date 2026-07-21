import {
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from "@nestjs/common";
import { connect, connection, disconnect } from "mongoose";

import { loadDatabaseConfig } from "./database.config";

@Injectable()
export class DatabaseConnectionService
  implements OnModuleInit, OnApplicationShutdown
{
  private connectionPromise?: Promise<void>;

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async connect(): Promise<void> {
    if (connection.readyState === 1) return;

    if (!this.connectionPromise) {
      const { uri } = loadDatabaseConfig(process.env);
      this.connectionPromise = connect(uri)
        .then(() => undefined)
        .catch((error: unknown) => {
          this.connectionPromise = undefined;
          throw error;
        });
    }

    await this.connectionPromise;
  }

  async onApplicationShutdown(): Promise<void> {
    if (connection.readyState !== 0) {
      await disconnect();
    }
    this.connectionPromise = undefined;
  }
}
