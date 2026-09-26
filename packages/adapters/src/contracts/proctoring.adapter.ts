export type LiteIntegrityEvent = "FULLSCREEN_EXIT" | "TAB_SWITCH" | "WINDOW_BLUR";

export interface ProctoringAdapter {
  recordEvent(kind: LiteIntegrityEvent, receivedAt: Date): {
    kind: LiteIntegrityEvent;
    occurredAt: Date;
  };
}
