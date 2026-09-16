import "./instrument";
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { loadCorsOptions } from "./cors.config";
import { JsonLogger } from "./observability/json-logger";
import { configureTrustProxy } from "./trust-proxy.config";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLogger(),
  });
  const port = Number(process.env.PORT ?? 4000);

  configureTrustProxy(app);
  app.enableCors(loadCorsOptions(process.env));

  await app.listen(port, "0.0.0.0");
}

void bootstrap();
