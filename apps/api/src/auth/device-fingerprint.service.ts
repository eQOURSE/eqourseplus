import { Inject, Injectable } from "@nestjs/common";
import { createHmac } from "node:crypto";

import type { AuthConfig } from "./auth.config";
import { AUTH_CONFIG } from "./auth.constants";

export interface DeviceSignals {
  ip: string;
  userAgent: string;
  acceptLanguage: string;
}

@Injectable()
export class DeviceFingerprintService {
  constructor(@Inject(AUTH_CONFIG) private readonly config: AuthConfig) {}

  hash(signals: DeviceSignals): string {
    // JWT_SECRET rotation intentionally resets device matching: every stored
    // fingerprint becomes incomparable and returning devices appear new.
    const hmac = createHmac("sha256", this.config.jwtSecret);
    hmac.update("eqourse-plus:device-fingerprint:v1:");
    for (const value of [signals.ip, signals.userAgent, signals.acceptLanguage]) {
      hmac.update(String(Buffer.byteLength(value)));
      hmac.update(":");
      hmac.update(value);
      hmac.update(";");
    }
    return hmac.digest("hex");
  }
}
