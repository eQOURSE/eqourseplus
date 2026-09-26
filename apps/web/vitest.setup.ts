import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  disconnect() {}

  observe(target: Element) {
    this.callback(
      [
        {
          isIntersecting: true,
          intersectionRatio: 1,
          target,
        } as IntersectionObserverEntry,
      ],
      this,
    );
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve() {}
}

vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);
globalThis.IntersectionObserver = TestIntersectionObserver;
beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);
  globalThis.IntersectionObserver = TestIntersectionObserver;
});
