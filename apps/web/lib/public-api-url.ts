export function publicApiUrl(path: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}
