interface CorsEnvironment {
  NODE_ENV?: string;
  CORS_ORIGINS?: string;
}

export interface ApiCorsOptions {
  origin: string[];
  credentials: false;
}

const LOCAL_WEB_ORIGIN = "http://localhost:3000";

export function loadCorsOptions(
  environment: CorsEnvironment,
): ApiCorsOptions {
  const configured = environment.CORS_ORIGINS?.trim();
  if (!configured && environment.NODE_ENV === "production") {
    throw new Error("CORS_ORIGINS must be configured in production");
  }

  const values = (configured ?? LOCAL_WEB_ORIGIN)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (values.length === 0) {
    throw new Error("CORS_ORIGINS must contain at least one origin");
  }

  const origins = values.map(validateOrigin);
  return {
    origin: [...new Set(origins)],
    credentials: false,
  };
}

function validateOrigin(value: string): string {
  if (value === "*") {
    throw new Error("CORS_ORIGINS must never contain a wildcard");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`CORS_ORIGINS contains an invalid origin: ${value}`);
  }

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.origin !== value ||
    parsed.username !== "" ||
    parsed.password !== ""
  ) {
    throw new Error(`CORS_ORIGINS contains a non-origin value: ${value}`);
  }

  return parsed.origin;
}
