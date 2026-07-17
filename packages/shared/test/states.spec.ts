import { describe, expect, it } from "vitest";

import {
  canTransitionEarningLine,
  canTransitionPayoutBatch,
  canTransitionProfile,
  canTransitionTask,
  EarningLineStatus,
  earningLineStatusSchema,
  PayoutBatchState,
  payoutBatchStateSchema,
  ProfileState,
  profileStateSchema,
  TaskState,
  taskStateSchema,
} from "../src";

describe("FR-FND-01 normative state enums", () => {
  it("exports the F1 profile states exactly", () => {
    expect(Object.values(ProfileState)).toEqual([
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "TEST_PENDING",
      "TEST_PASSED",
      "APPROVED",
      "REJECTED",
      "MORE_INFO_NEEDED",
    ]);
  });

  it("exports the F4 task states exactly", () => {
    expect(Object.values(TaskState)).toEqual([
      "QUEUED",
      "IN_PROGRESS",
      "SUBMITTED",
      "IN_QA",
      "AUTO_ACCEPT",
      "ACCEPTED",
      "REWORK",
      "REJECTED",
      "EXPIRED",
    ]);
  });

  it("exports the normative F5 payout batch states including CANCELLED", () => {
    expect(Object.values(PayoutBatchState)).toEqual([
      "PENDING",
      "APPROVED",
      "PROCESSING",
      "SUCCEEDED",
      "FAILED",
      "RETRY_QUEUED",
      "CANCELLED",
    ]);
  });

  it("exports the normative EarningLine statuses", () => {
    expect(Object.values(EarningLineStatus)).toEqual([
      "ACCRUED",
      "LOCKED_IN_BATCH",
      "PAID",
      "FAILED",
      "DISPUTED",
    ]);
  });

  it("validates known states and rejects unknown strings", () => {
    expect(profileStateSchema.parse("DRAFT")).toBe(ProfileState.DRAFT);
    expect(taskStateSchema.parse("IN_QA")).toBe(TaskState.IN_QA);
    expect(payoutBatchStateSchema.parse("CANCELLED")).toBe(
      PayoutBatchState.CANCELLED,
    );
    expect(earningLineStatusSchema.parse("LOCKED_IN_BATCH")).toBe(
      EarningLineStatus.LOCKED_IN_BATCH,
    );
    expect(() => payoutBatchStateSchema.parse("UNKNOWN")).toThrow();
  });

  it("guards the F1 and F4 transition graphs", () => {
    expect(canTransitionProfile(ProfileState.DRAFT, ProfileState.SUBMITTED)).toBe(
      true,
    );
    expect(canTransitionProfile(ProfileState.DRAFT, ProfileState.APPROVED)).toBe(
      false,
    );
    expect(canTransitionTask(TaskState.REWORK, TaskState.SUBMITTED)).toBe(true);
    expect(canTransitionTask(TaskState.QUEUED, TaskState.ACCEPTED)).toBe(false);
  });

  it("guards F5 cancellation as admin-only and audit-logged", () => {
    expect(
      canTransitionPayoutBatch(
        PayoutBatchState.PENDING,
        PayoutBatchState.CANCELLED,
        { isAdmin: true, auditLogged: true },
      ),
    ).toBe(true);
    expect(
      canTransitionPayoutBatch(
        PayoutBatchState.APPROVED,
        PayoutBatchState.CANCELLED,
        { isAdmin: false, auditLogged: true },
      ),
    ).toBe(false);
    expect(
      canTransitionPayoutBatch(
        PayoutBatchState.PROCESSING,
        PayoutBatchState.CANCELLED,
        { isAdmin: true, auditLogged: true },
      ),
    ).toBe(false);
  });

  it("guards the append-only EarningLine status progression", () => {
    expect(
      canTransitionEarningLine(
        EarningLineStatus.ACCRUED,
        EarningLineStatus.LOCKED_IN_BATCH,
      ),
    ).toBe(true);
    expect(
      canTransitionEarningLine(
        EarningLineStatus.LOCKED_IN_BATCH,
        EarningLineStatus.PAID,
      ),
    ).toBe(true);
    expect(
      canTransitionEarningLine(
        EarningLineStatus.PAID,
        EarningLineStatus.ACCRUED,
      ),
    ).toBe(false);
  });
});
