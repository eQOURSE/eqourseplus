"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function SentryErrorReporter({
  error,
}: Pick<GlobalErrorProps, "error">): null {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return null;
}

export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps): JSX.Element {
  return (
    <html lang="en">
      <body>
        <SentryErrorReporter error={error} />
        <main>
          <h1>Something went wrong</h1>
          <p>The error has been reported. Please try again.</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
