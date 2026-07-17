import { z } from "zod";

import { EarningLineStatus } from "../states/earning-line-status";
import { PayoutBatchState } from "../states/payout-batch-state";
import { ProfileState } from "../states/profile-state";
import { TaskState } from "../states/task-state";

export const profileStateSchema = z.enum(ProfileState);
export const taskStateSchema = z.enum(TaskState);
export const payoutBatchStateSchema = z.enum(PayoutBatchState);
export const earningLineStatusSchema = z.enum(EarningLineStatus);
