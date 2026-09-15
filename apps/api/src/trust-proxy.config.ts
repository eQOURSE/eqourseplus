import type { INestApplication } from "@nestjs/common";

interface ExpressApplication {
  set(setting: "trust proxy", value: number): void;
}

// Cloud Run appends the client address it observed after any caller-supplied
// X-Forwarded-For values, so only the nearest proxy hop is trusted.
export const TRUST_PROXY_HOPS = 1;

export function configureTrustProxy(app: INestApplication): void {
  const express = app.getHttpAdapter().getInstance() as ExpressApplication;
  express.set("trust proxy", TRUST_PROXY_HOPS);
}
