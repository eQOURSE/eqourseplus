import { z } from "zod";

import { EarningLineStatus } from "../states/earning-line-status";
import { PayoutBatchState } from "../states/payout-batch-state";
import { ProfileState } from "../states/profile-state";
import { TaskState } from "../states/task-state";

export const profileStateSchema = z.enum(ProfileState);
export const taskStateSchema = z.enum(TaskState);
export const payoutBatchStateSchema = z.enum(PayoutBatchState);
export const earningLineStatusSchema = z.enum(EarningLineStatus);

export const companyReviewDecisionSchema = z
  .object({
    decision: z.enum([
      "START_REVIEW",
      "APPROVE",
      "REJECT",
      "REQUEST_MORE_INFO",
    ]),
    reason: z.string().trim().min(1).max(1_000),
  })
  .strict();

export type CompanyReviewDecisionInput = z.infer<
  typeof companyReviewDecisionSchema
>;
