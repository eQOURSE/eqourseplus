import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { captureException } = vi.hoisted(() => ({
  captureException: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException,
}));

import { SentryErrorReporter } from "./global-error";

describe("FR-FND-06 web Sentry acceptance", () => {
  beforeEach(() => {
    captureException.mockClear();
  });

  it("sends the exact deliberately thrown web error to Sentry", async () => {
    let deliberateError: Error;

    try {
      throw new Error("FR-FND-06 deliberate web error");
    } catch (error) {
      deliberateError = error as Error;
    }

    render(<SentryErrorReporter error={deliberateError} />);

    await waitFor(() => {
      expect(captureException).toHaveBeenCalledTimes(1);
      expect(captureException).toHaveBeenCalledWith(deliberateError);
      expect((captureException.mock.calls[0] as [Error])[0].message).toBe(
        "FR-FND-06 deliberate web error",
      );
    });
  });
});
