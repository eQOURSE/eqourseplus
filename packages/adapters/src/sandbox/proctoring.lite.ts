import type { LiteIntegrityEvent, ProctoringAdapter } from "../contracts/proctoring.adapter";

export class LiteProctoringAdapter implements ProctoringAdapter {
  recordEvent(kind: LiteIntegrityEvent, receivedAt: Date) {
    return { kind, occurredAt: receivedAt };
  }
}
