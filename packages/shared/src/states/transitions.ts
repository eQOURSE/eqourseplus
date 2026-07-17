import { EarningLineStatus } from "./earning-line-status";
import { PayoutBatchState } from "./payout-batch-state";
import { ProfileState } from "./profile-state";
import { TaskState } from "./task-state";

const profileTransitions: Readonly<Record<ProfileState, readonly ProfileState[]>> = {
  [ProfileState.DRAFT]: [ProfileState.SUBMITTED],
  [ProfileState.SUBMITTED]: [ProfileState.UNDER_REVIEW],
  [ProfileState.UNDER_REVIEW]: [
    ProfileState.TEST_PENDING,
    ProfileState.REJECTED,
    ProfileState.MORE_INFO_NEEDED,
  ],
  [ProfileState.TEST_PENDING]: [ProfileState.TEST_PASSED],
  [ProfileState.TEST_PASSED]: [ProfileState.APPROVED],
  [ProfileState.APPROVED]: [],
  [ProfileState.REJECTED]: [],
  [ProfileState.MORE_INFO_NEEDED]: [ProfileState.SUBMITTED],
};

const taskTransitions: Readonly<Record<TaskState, readonly TaskState[]>> = {
  [TaskState.QUEUED]: [TaskState.IN_PROGRESS],
  [TaskState.IN_PROGRESS]: [TaskState.SUBMITTED, TaskState.EXPIRED],
  [TaskState.SUBMITTED]: [TaskState.IN_QA, TaskState.AUTO_ACCEPT],
  [TaskState.IN_QA]: [
    TaskState.ACCEPTED,
    TaskState.REWORK,
    TaskState.REJECTED,
  ],
  [TaskState.AUTO_ACCEPT]: [],
  [TaskState.ACCEPTED]: [],
  [TaskState.REWORK]: [TaskState.SUBMITTED],
  [TaskState.REJECTED]: [],
  [TaskState.EXPIRED]: [TaskState.QUEUED],
};

const payoutBatchTransitions: Readonly<
  Record<PayoutBatchState, readonly PayoutBatchState[]>
> = {
  [PayoutBatchState.PENDING]: [
    PayoutBatchState.APPROVED,
    PayoutBatchState.CANCELLED,
  ],
  [PayoutBatchState.APPROVED]: [
    PayoutBatchState.PROCESSING,
    PayoutBatchState.CANCELLED,
  ],
  [PayoutBatchState.PROCESSING]: [
    PayoutBatchState.SUCCEEDED,
    PayoutBatchState.FAILED,
  ],
  [PayoutBatchState.SUCCEEDED]: [],
  [PayoutBatchState.FAILED]: [PayoutBatchState.RETRY_QUEUED],
  [PayoutBatchState.RETRY_QUEUED]: [PayoutBatchState.PROCESSING],
  [PayoutBatchState.CANCELLED]: [],
};

const earningLineTransitions: Readonly<
  Record<EarningLineStatus, readonly EarningLineStatus[]>
> = {
  [EarningLineStatus.ACCRUED]: [EarningLineStatus.LOCKED_IN_BATCH],
  [EarningLineStatus.LOCKED_IN_BATCH]: [
    EarningLineStatus.PAID,
    EarningLineStatus.FAILED,
    EarningLineStatus.DISPUTED,
  ],
  [EarningLineStatus.PAID]: [],
  [EarningLineStatus.FAILED]: [],
  [EarningLineStatus.DISPUTED]: [],
};

export interface PayoutCancellationContext {
  isAdmin: boolean;
  auditLogged: boolean;
}

export function canTransitionProfile(
  from: ProfileState,
  to: ProfileState,
): boolean {
  return profileTransitions[from].includes(to);
}

export function canTransitionTask(from: TaskState, to: TaskState): boolean {
  return taskTransitions[from].includes(to);
}

export function canTransitionPayoutBatch(
  from: PayoutBatchState,
  to: PayoutBatchState,
  context: PayoutCancellationContext = {
    isAdmin: false,
    auditLogged: false,
  },
): boolean {
  if (to === PayoutBatchState.CANCELLED) {
    return (
      context.isAdmin &&
      context.auditLogged &&
      payoutBatchTransitions[from].includes(to)
    );
  }

  return payoutBatchTransitions[from].includes(to);
}

export function canTransitionEarningLine(
  from: EarningLineStatus,
  to: EarningLineStatus,
): boolean {
  return earningLineTransitions[from].includes(to);
}
