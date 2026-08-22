import { describe, expect, it } from "vitest";

import { activeRefreshSessionPredicate } from "../src/auth/refresh-session";

describe("FR-REG-02A active refresh-session predicate", () => {
  const now = new Date("2026-08-22T10:00:00.000Z");
  const base = {
    digest: "digest",
    createdAt: new Date("2026-08-22T09:00:00.000Z"),
    expiresAt: new Date("2026-08-22T11:00:00.000Z"),
  };

  it("accepts only an unexpired session whose revokedAt field is absent", () => {
    expect(activeRefreshSessionPredicate.test(base, now)).toBe(true);
    expect(
      activeRefreshSessionPredicate.test({ ...base, revokedAt: null }, now),
    ).toBe(false);
    expect(
      activeRefreshSessionPredicate.test({ ...base, revokedAt: now }, now),
    ).toBe(false);
    expect(
      activeRefreshSessionPredicate.test(
        { ...base, expiresAt: new Date(now) },
        now,
      ),
    ).toBe(false);
  });
});
