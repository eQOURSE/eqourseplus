export function publicApiUrl(path: string): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredBaseUrl) {
    return `${configuredBaseUrl.replace(/\/+$/, "")}${path}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_URL is required in deployed environments",
    );
  }

  return `http://localhost:4000${path}`;
}
