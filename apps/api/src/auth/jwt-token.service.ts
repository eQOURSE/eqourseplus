import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomUUID } from "node:crypto";

import { AUTH_CONFIG } from "./auth.constants";
import type { AuthConfig } from "./auth.config";
import type { RefreshSession } from "./auth.store";
import type { TokenPair } from "./auth.types";

type TokenType = "access" | "refresh";

interface TokenPayload {
  sub: string;
  type: TokenType;
  jti: string;
  iat: number;
  exp: number;
  iss: "eqourse-plus-api";
  aud: "eqourse-plus";
}

export interface IssuedTokenPair extends TokenPair {
  refreshSession: RefreshSession;
}

@Injectable()
export class JwtTokenService {
  constructor(
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
  ) {}

  issuePair(userId: string, now: Date): IssuedTokenPair {
    const accessToken = this.sign(
      userId,
      "access",
      now,
      this.config.accessTokenTtlSeconds,
    );
    const refreshToken = this.sign(
      userId,
      "refresh",
      now,
      this.config.refreshTokenTtlSeconds,
    );

    return {
      accessToken,
      refreshToken,
      refreshSession: {
        digest: this.digest(refreshToken),
        createdAt: now,
        expiresAt: new Date(
          now.getTime() + this.config.refreshTokenTtlSeconds * 1000,
        ),
      },
    };
  }

  verifyAccess(token: string, now: Date): TokenPayload {
    return this.verify(token, "access", now);
  }

  verifyRefresh(token: string, now: Date): TokenPayload {
    return this.verify(token, "refresh", now);
  }

  digest(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private sign(
    userId: string,
    type: TokenType,
    now: Date,
    ttlSeconds: number,
  ): string {
    const issuedAt = Math.floor(now.getTime() / 1000);
    const payload: TokenPayload = {
      sub: userId,
      type,
      jti: randomUUID(),
      iat: issuedAt,
      exp: issuedAt + ttlSeconds,
      iss: "eqourse-plus-api",
      aud: "eqourse-plus",
    };
    return this.jwtService.sign(payload, {
      secret: this.config.jwtSecret,
      algorithm: "HS256",
    });
  }

  private verify(
    token: string,
    expectedType: TokenType,
    now: Date,
  ): TokenPayload {
    const payload = this.jwtService.verify<TokenPayload>(token, {
      secret: this.config.jwtSecret,
      algorithms: ["HS256"],
      issuer: "eqourse-plus-api",
      audience: "eqourse-plus",
      ignoreExpiration: true,
    });
    if (
      payload.type !== expectedType ||
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(now.getTime() / 1000)
    ) {
      throw new Error("Invalid or expired token");
    }
    return payload;
  }
}
