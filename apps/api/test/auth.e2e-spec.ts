import type { INestApplication } from "@nestjs/common";
import { Controller, Get } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  BusinessUnit,
  ProfileState,
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
import { JwtTokenService } from "../src/auth/jwt-token.service";
import { activeRefreshSessionPredicate } from "../src/auth/refresh-session";

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
      profileState: ProfileState;
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
        activeRefreshSessionPredicate.test(session, now),
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
      (candidate) =>
        candidate.digest === digest &&
        activeRefreshSessionPredicate.test(candidate, now),
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
  let tokens: JwtTokenService;

  const users = [
    {
      id: "freelancer-1",
      email: "freelancer@example.com",
      profileState: ProfileState.DRAFT,
      roleAssignments: [
        { role: Role.FREELANCER, businessUnit: BusinessUnit.EQOURSE },
      ],
    },
    {
      id: "pm-1",
      email: "pm@example.com",
      profileState: ProfileState.SUBMITTED,
      roleAssignments: [
        { role: Role.PROJECT_MANAGER, businessUnit: BusinessUnit.EQOURSE },
      ],
    },
    {
      id: "pm-tutrain",
      email: "pm-tutrain@example.com",
      profileState: ProfileState.UNDER_REVIEW,
      roleAssignments: [
        { role: Role.PROJECT_MANAGER, businessUnit: BusinessUnit.TUTRAIN },
      ],
    },
    {
      id: "super-admin-1",
      email: "admin@example.com",
      profileState: ProfileState.APPROVED,
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
    tokens = app.get(JwtTokenService);
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

  async function issueRefreshToken(userId: string): Promise<string> {
    const issued = tokens.issuePair(userId, clock.now);
    await store.addRefreshSession(userId, issued.refreshSession);
    return issued.refreshToken;
  }

  function addUser(id: string): void {
    store.users.set(id, {
      id,
      email: `${id}@example.com`,
      profileState: ProfileState.DRAFT,
      roleAssignments: [],
      refreshSessions: [],
    });
  }

  function refresh(refreshToken: string, ip = "203.0.113.200") {
    return request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .set("x-forwarded-for", ip)
      .send({ refreshToken });
  }

  function logout(refreshToken: string, ip = "203.0.113.200") {
    return request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .set("x-forwarded-for", ip)
      .send({ refreshToken });
  }

  it("keeps every existing auth handler public after moving controller metadata", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/request")
      .send({ email: "freelancer@example.com" })
      .expect(202);
    const code = mailer.deliveries.findLast(
      (delivery) => delivery.to === "freelancer@example.com",
    )?.code;
    const verified = await request(app.getHttpServer())
      .post("/api/v1/auth/otp/verify")
      .send({ email: "freelancer@example.com", otp: code })
      .expect(200);
    const refreshed = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: verified.body.refreshToken })
      .expect(200);
    await request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(204);
  });

  it("returns exactly the authenticated caller session without sensitive fields", async () => {
    const stored = store.users.get("freelancer-1");
    if (!stored) throw new Error("Expected the freelancer fixture");
    stored.phone = "+919876543210";
    stored.otpChallenge = {
      digest: "otp-digest",
      expiresAt: new Date(clock.now.getTime() + 60_000),
      wrongAttempts: 0,
    };
    const issued = tokens.issuePair(stored.id, clock.now);

    const response = await request(app.getHttpServer())
      .get("/api/v1/auth/session")
      .auth(issued.accessToken, { type: "bearer" })
      .expect(200);

    expect(response.body).toEqual({
      userId: "freelancer-1",
      email: "freelancer@example.com",
      roleAssignments: [
        { role: Role.FREELANCER, businessUnit: BusinessUnit.EQOURSE },
      ],
      profileState: ProfileState.DRAFT,
    });
    expect(Object.keys(response.body).sort()).toEqual(
      ["email", "profileState", "roleAssignments", "userId"].sort(),
    );
    const serialized = JSON.stringify(response.body);
    for (const prohibited of [
      "phone",
      "pan",
      "otpChallenge",
      "refreshSessions",
      "deviceFingerprints",
      "reviewFlags",
      "accessToken",
      "refreshToken",
    ]) {
      expect(serialized).not.toContain(prohibited);
    }
    expect(serialized).not.toContain(issued.accessToken);
    expect(serialized).not.toContain(issued.refreshToken);
    expect(response.headers["cache-control"]).toContain("no-store");
  });

  it("rejects missing, malformed, expired and wrong-type session credentials", async () => {
    await request(app.getHttpServer()).get("/api/v1/auth/session").expect(401);

    await request(app.getHttpServer())
      .get("/api/v1/auth/session")
      .auth("malformed-access-token", { type: "bearer" })
      .expect(401);

    const issued = tokens.issuePair("freelancer-1", clock.now);
    clock.advance(15 * 60 * 1000 + 1);
    await request(app.getHttpServer())
      .get("/api/v1/auth/session")
      .auth(issued.accessToken, { type: "bearer" })
      .expect(401);

    const current = tokens.issuePair("freelancer-1", clock.now);
    await request(app.getHttpServer())
      .get("/api/v1/auth/session")
      .auth(current.refreshToken, { type: "bearer" })
      .expect(401);
  });

  it("uses the same 401 body for malformed tokens and missing subjects", async () => {
    const malformed = await request(app.getHttpServer())
      .get("/api/v1/auth/session")
      .auth("malformed-access-token", { type: "bearer" })
      .expect(401);
    const missingSubjectToken = tokens.issuePair("deleted-user", clock.now);
    const missingSubject = await request(app.getHttpServer())
      .get("/api/v1/auth/session")
      .auth(missingSubjectToken.accessToken, { type: "bearer" })
      .expect(401);

    expect(missingSubject.body).toEqual(malformed.body);
  });

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
    const verified = await request(app.getHttpServer())
      .post("/api/v1/auth/otp/verify")
      .send({ email: "freelancer@example.com", otp: code })
      .expect(200);
    expect(verified.headers["cache-control"]).toContain("no-store");
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

  it("retains the IP cap on OTP verification across distinct identifiers", async () => {
    const sharedIp = "203.0.113.181";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post("/api/v1/auth/otp/verify")
        .set("x-forwarded-for", sharedIp)
        .send({ email: `spray-${attempt}@example.com`, otp: "000000" })
        .expect(401);
    }
    await request(app.getHttpServer())
      .post("/api/v1/auth/otp/verify")
      .set("x-forwarded-for", sharedIp)
      .send({ email: "spray-final@example.com", otp: "000000" })
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
    expect(response.headers["cache-control"]).toContain("no-store");
    expect(response.body.refreshToken).not.toBe(first.refreshToken);

    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: first.refreshToken })
      .expect(401);
  });

  it("allows many subjects to refresh from one server IP", async () => {
    const serverIp = "203.0.113.200";
    const refreshTokens: string[] = [];
    for (let index = 0; index < 6; index += 1) {
      const id = `shared-ip-user-${index}`;
      addUser(id);
      refreshTokens.push(await issueRefreshToken(id));
    }

    for (const refreshToken of refreshTokens) {
      await request(app.getHttpServer())
        .post("/api/v1/auth/refresh")
        .set("x-forwarded-for", serverIp)
        .send({ refreshToken })
        .expect(200);
    }
  });

  it("rate-limits one refresh subject without rotating the blocked token or blocking logout", async () => {
    const id = "limited-refresh-user";
    addUser(id);
    let current = await issueRefreshToken(id);
    const logoutToken = await issueRefreshToken(id);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await refresh(current).expect(200);
      current = response.body.refreshToken as string;
    }
    await refresh(current).expect(429);
    await logout(logoutToken).expect(204);

    clock.advance(60_000 + 1);
    await refresh(current, "203.0.113.201").expect(200);
  });

  it("isolates active refresh buckets by verified subject", async () => {
    addUser("bucket-user-a");
    addUser("bucket-user-b");
    let tokenA = await issueRefreshToken("bucket-user-a");
    const tokenB = await issueRefreshToken("bucket-user-b");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await refresh(tokenA).expect(200);
      tokenA = response.body.refreshToken as string;
    }
    await refresh(tokenA).expect(429);
    await refresh(tokenB).expect(200);
    await refresh(tokenA).expect(429);
  });

  it("isolates inactive replays from the subject's current active refresh token", async () => {
    const id = "inactive-replay-user";
    addUser(id);
    const original = await issueRefreshToken(id);
    const rotated = await refresh(original).expect(200);
    const active = rotated.body.refreshToken as string;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await refresh(original).expect(401);
    }
    await refresh(original).expect(429);
    await refresh(active, "203.0.113.202").expect(200);
  });

  it("treats an explicit revokedAt null as inactive in the fake store", async () => {
    const id = "null-revocation-user";
    addUser(id);
    const nullRevoked = await issueRefreshToken(id);
    const stored = store.users.get(id)?.refreshSessions[0];
    if (!stored) throw new Error("Expected a stored refresh session");
    stored.revokedAt = null;
    const active = await issueRefreshToken(id);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await refresh(nullRevoked).expect(401);
    }
    await refresh(nullRevoked).expect(429);
    await refresh(active, "203.0.113.205").expect(200);
  });

  it("uses an endpoint-scoped constant bucket for malformed and forged refresh JWTs", async () => {
    const malformed = "x".repeat(32);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await refresh(malformed).expect(401);
    }
    await refresh(malformed).expect(429);

    clock.advance(60_000 + 1);
    addUser("forged-token-user");
    const signed = await issueRefreshToken("forged-token-user");
    const parts = signed.split(".");
    if (!parts[2]) throw new Error("Expected a signed JWT");
    parts[2] = `${parts[2][0] === "a" ? "b" : "a"}${parts[2].slice(1)}`;
    const forged = parts.join(".");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await refresh(forged, "203.0.113.203").expect(401);
    }
    await refresh(forged, "203.0.113.203").expect(429);
  });

  it("does not revoke a session when the logout active bucket is exhausted", async () => {
    const id = "limited-logout-user";
    addUser(id);
    const sessions: string[] = [];
    for (let index = 0; index < 6; index += 1) {
      sessions.push(await issueRefreshToken(id));
    }

    for (const refreshToken of sessions.slice(0, 5)) {
      await logout(refreshToken).expect(204);
    }
    const preserved = sessions[5] as string;
    await logout(preserved).expect(429);

    clock.advance(60_000 + 1);
    await refresh(preserved, "203.0.113.204").expect(200);
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
