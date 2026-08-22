import type { RefreshSession } from "./auth.store";

export const activeRefreshSessionPredicate = {
  test(session: RefreshSession, now: Date): boolean {
    return session.revokedAt === undefined && session.expiresAt > now;
  },

  mongoFilter(now: Date) {
    return {
      revokedAt: { $exists: false },
      expiresAt: { $gt: now },
    } as const;
  },

  mongoExpression(sessionPath: `$$${string}`, now: Date) {
    return {
      $and: [
        {
          $eq: [{ $type: `${sessionPath}.revokedAt` }, "missing"],
        },
        { $gt: [`${sessionPath}.expiresAt`, now] },
      ],
    } as const;
  },
};
