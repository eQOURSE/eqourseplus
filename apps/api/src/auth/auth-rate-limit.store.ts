import { Injectable } from "@nestjs/common";

interface RateLimitRecord {
  count: number;
  windowStartedAt: number;
}

@Injectable()
export class InMemoryAuthRateLimitStore {
  private readonly records = new Map<string, RateLimitRecord>();

  consume(
    key: string,
    now: Date,
    limit: number,
    windowMilliseconds: number,
  ): boolean {
    const timestamp = now.getTime();
    const existing = this.records.get(key);
    if (!existing || timestamp - existing.windowStartedAt >= windowMilliseconds) {
      this.records.set(key, { count: 1, windowStartedAt: timestamp });
      return true;
    }
    if (existing.count >= limit) {
      return false;
    }
    existing.count += 1;
    return true;
  }
}
