import "./instrument";
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { JsonLogger } from "./observability/json-logger";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLogger(),
  });
  const port = Number(process.env.PORT ?? 4000);

  await app.listen(port, "0.0.0.0");
}

void bootstrap();
