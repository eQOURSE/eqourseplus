import type { INestApplication } from "@nestjs/common";
import { Controller, Get } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  BusinessUnit,
  type RoleAssignment,
  Role,
} from "@eqourse/shared";
import { SandboxMailerAdapter } from "@eqourse/adapters";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AUTH_CLOCK, AUTH_STORE, MAILER_ADAPTER } from "../src/auth/auth.constants";
import { loadAuthConfig } from "../src/auth/auth.config";
import { AuthModule } from "../src/auth/auth.module";
import { Roles } from "../src/auth/roles.decorator";
import type {
  AuthStore,
  OtpChallenge,
  RefreshSession,
  StoredUser,
} from "../src/auth/auth.store";
import { InMemoryAuthRateLimitStore } from "../src/auth/auth-rate-limit.store";

class MutableClock {
  now = new Date("2026-07-20T10:00:00.000Z");

  advance(milliseconds: number): void {
    this.now = new Date(this.now.getTime() + milliseconds);
  }
}

class InMemoryAuthStore implements AuthStore {
  readonly users = new Map<string, StoredUser>();

  constructor(
    users: Array<{
      id: string;
      email: string;
      roleAssignments: RoleAssignment[];
    }>,
  ) {
    for (const user of users) {
      this.users.set(user.id, {
        ...user,
        refreshSessions: [],
      });
    }
  }

  async findByEmail(email: string): Promise<StoredUser | null> {
    return (
      [...this.users.values()].find((user) => user.email === email) ?? null
    );
  }

  async findById(id: string): Promise<StoredUser | null> {
    return this.users.get(id) ?? null;
  }

  async setOtpChallenge(userId: string, challenge: OtpChallenge): Promise<void> {
    const user = this.requireUser(userId);
    user.otpChallenge = challenge;
  }

  async verifyOtp(
    userId: string,
    digest: string,
    now: Date,
    maxWrongAttempts: number,
  ): Promise<"VALID" | "INVALID" | "EXPIRED"> {
    const user = this.requireUser(userId);
    const challenge = user.otpChallenge;
    if (!challenge || challenge.expiresAt <= now) {
      user.otpChallenge = undefined;
      return "EXPIRED";
    }
    if (challenge.digest !== digest) {
      challenge.wrongAttempts += 1;
      if (challenge.wrongAttempts >= maxWrongAttempts) {
        user.otpChallenge = undefined;
      }
      return "INVALID";
    }
    user.otpChallenge = undefined;
    return "VALID";
  }

  async addRefreshSession(
    userId: string,
    session: RefreshSession,
  ): Promise<void> {
    this.requireUser(userId).refreshSessions.push(session);
  }

  async rotateRefreshSession(
    userId: string,
    currentDigest: string,
    replacement: RefreshSession,
    now: Date,
  ): Promise<boolean> {
    const sessions = this.requireUser(userId).refreshSessions;
    const current = sessions.find(
      (session) =>
        session.digest === currentDigest &&
        !session.revokedAt &&
        session.expiresAt > now,
    );
    if (!current) return false;
    current.revokedAt = now;
    sessions.push(replacement);
    return true;
  }

  async revokeRefreshSession(
    userId: string,
    digest: string,
    now: Date,
  ): Promise<boolean> {
    const session = this.requireUser(userId).refreshSessions.find(
      (candidate) => candidate.digest === digest && !candidate.revokedAt,
    );
    if (!session) return false;
    session.revokedAt = now;
    return true;
  }

  private requireUser(id: string): StoredUser {
    const user = this.users.get(id);
    if (!user) throw new Error(`Missing test user ${id}`);
    return user;
  }
}

@Controller("test")
class ProtectedTestController {
  @Get("pm-eqourse")
  @Roles(Role.PROJECT_MANAGER, BusinessUnit.EQOURSE)
  protectedRoute(): { ok: true } {
    return { ok: true };
  }
}

describe("FR-FND-02 auth core", () => {
  let app: INestApplication;
  let store: InMemoryAuthStore;
  let mailer: SandboxMailerAdapter;
  let clock: MutableClock;

  const users = [
    {
      id: "freelancer-1",
      email: "freelancer@example.com",
      roleAssignments: [
        { role: Role.FREELANCER, businessUnit: BusinessUnit.EQOURSE },
      ],
    },
    {
      id: "pm-1",
      email: "pm@example.com",
      roleAssignments: [
        { role: Role.PROJECT_MANAGER, businessUnit: BusinessUnit.EQOURSE },
      ],
    },
    {
      id: "pm-tutrain",
      email: "pm-tutrain@example.com",
      roleAssignments: [
        { role: Role.PROJECT_MANAGER, businessUnit: BusinessUnit.TUTRAIN },
      ],
    },
    {
      id: "super-admin-1",
      email: "admin@example.com",
      roleAssignments: [
        { role: Role.SUPER_ADMIN, businessUnit: BusinessUnit.TUTRAIN },
      ],
    },
  ];

  beforeEach(async () => {
    process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
    store = new InMemoryAuthStore(users);
    mailer = new SandboxMailerAdapter();
    clock = new MutableClock();

    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
      controllers: [ProtectedTestController],
    })
      .overrideProvider(AUTH_STORE)
      .useValue(store)
      .overrideProvider(MAILER_ADAPTER)
      .useValue(mailer)
      .overrideProvider(AUTH_CLOCK)
      .useValue({ now: () => clock.now })
      .overrideProvider(InMemoryAuthRateLimitStore)
      .useValue(new InMemoryAuthRateLimitStore())
      .compile();

    app = moduleRef.createNestApplication();
    const express = app.getHttpAdapter().getInstance() as {
      set(setting: string, value: boolean): void;
    };
    express.set("trust proxy", true);
    await app.init();
  });

  afterEach(async () => {
    delete process.env.JWT_SECRET;
    if (app) await app.close();
  });

  async function signIn(email: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/request")
      .send({ email })
      .expect(202);
    const delivery = mailer.deliveries.findLast((item) => item.to === email);
    if (!delivery) throw new Error(`Missing OTP delivery for ${email}`);
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/otp/verify")
      .send({ email, otp: delivery.code })
      .expect(200);
    return response.body as { accessToken: string; refreshToken: string };
  }

  it("rejects invalid auth request bodies with HTTP 400", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/request")
      .send({ email: "not-an-email" })
      .expect(400);
  });

  it("requires JWT_SECRET from the environment", () => {
    expect(() => loadAuthConfig({})).toThrow(/JWT_SECRET/);
  });

  it("delivers a single-use OTP through the sandbox mailer", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/request")
      .send({ email: "freelancer@example.com" })
      .expect(202);
    expect(mailer.deliveries).toHaveLength(1);

    const code = mailer.deliveries[0]?.code;
    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/verify")
      .send({ email: "freelancer@example.com", otp: code })
      .expect(200);
    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/verify")
      .send({ email: "freelancer@example.com", otp: code })
      .expect(401);
  });

  it("invalidates an OTP after five wrong attempts", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/request")
      .send({ email: "freelancer@example.com" })
      .expect(202);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post("/api/v1/auth/otp/verify")
        .send({ email: "freelancer@example.com", otp: "000000" })
        .expect(401);
    }

    expect(store.users.get("freelancer-1")?.otpChallenge).toBeUndefined();
  });

  it("rate-limits OTP verification by normalized email across IP addresses", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post("/api/v1/auth/otp/verify")
        .set("x-forwarded-for", `198.51.100.${attempt + 1}`)
        .send({ email: "FREELANCER@example.com", otp: "000000" })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/verify")
      .set("x-forwarded-for", "203.0.113.99")
      .send({ email: "freelancer@example.com", otp: "000000" })
      .expect(429);
  });

  it("rejects an expired OTP", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/request")
      .send({ email: "freelancer@example.com" })
      .expect(202);
    const code = mailer.deliveries[0]?.code;
    clock.advance(10 * 60 * 1000 + 1);
    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/verify")
      .send({ email: "freelancer@example.com", otp: code })
      .expect(401);
  });

  it("stores only a hash of each refresh token", async () => {
    const tokens = await signIn("freelancer@example.com");
    const sessions = store.users.get("freelancer-1")?.refreshSessions ?? [];
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.digest).not.toBe(tokens.refreshToken);
    expect(JSON.stringify(sessions)).not.toContain(tokens.refreshToken);
  });

  it("rotates refresh tokens and rejects reuse of the old token", async () => {
    const first = await signIn("freelancer@example.com");
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: first.refreshToken })
      .expect(200);
    expect(response.body.refreshToken).not.toBe(first.refreshToken);

    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: first.refreshToken })
      .expect(401);
  });

  it("rejects an expired refresh token with HTTP 401", async () => {
    const tokens = await signIn("freelancer@example.com");
    clock.advance(30 * 24 * 60 * 60 * 1000 + 1);
    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: tokens.refreshToken })
      .expect(401);
  });

  it("revokes a refresh token on logout", async () => {
    const tokens = await signIn("freelancer@example.com");
    await request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .send({ refreshToken: tokens.refreshToken })
      .expect(204);
    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: tokens.refreshToken })
      .expect(401);
  });

  it("rate-limits auth endpoints by IP", async () => {
    for (let requestNumber = 0; requestNumber < 5; requestNumber += 1) {
      await request(app.getHttpServer())
        .post("/api/v1/auth/otp/request")
        .send({ email: "unknown@example.com" })
        .expect(202);
    }
    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/request")
      .send({ email: "unknown@example.com" })
      .expect(429);
  });

  it("returns 401 for an unauthenticated protected request", async () => {
    await request(app.getHttpServer()).get("/test/pm-eqourse").expect(401);
  });

  it("returns 403 for the wrong role", async () => {
    const tokens = await signIn("freelancer@example.com");
    await request(app.getHttpServer())
      .get("/test/pm-eqourse")
      .auth(tokens.accessToken, { type: "bearer" })
      .expect(403);
  });

  it("returns 403 for the correct role in the wrong business unit", async () => {
    const tokens = await signIn("pm-tutrain@example.com");
    await request(app.getHttpServer())
      .get("/test/pm-eqourse")
      .auth(tokens.accessToken, { type: "bearer" })
      .expect(403);
  });

  it("returns 200 for the correct role and business unit", async () => {
    const tokens = await signIn("pm@example.com");
    await request(app.getHttpServer())
      .get("/test/pm-eqourse")
      .auth(tokens.accessToken, { type: "bearer" })
      .expect(200, { ok: true });
  });

  it("allows SUPER_ADMIN regardless of business-unit scope", async () => {
    const tokens = await signIn("admin@example.com");
    await request(app.getHttpServer())
      .get("/test/pm-eqourse")
      .auth(tokens.accessToken, { type: "bearer" })
      .expect(200, { ok: true });
  });
});
