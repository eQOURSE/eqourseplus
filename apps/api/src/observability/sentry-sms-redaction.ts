interface SmsBreadcrumb {
  category?: string;
  data?: Record<string, unknown>;
}

export function isSensitiveSmsProviderRequest(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.toLowerCase() === "amazesms.in" &&
      parsed.pathname === "/api/pushsms"
    );
  } catch {
    return false;
  }
}

export function dropSensitiveSmsBreadcrumb<T extends SmsBreadcrumb>(
  breadcrumb: T,
): T | null {
  const url = breadcrumb.data?.url;
  if (
    breadcrumb.category === "http" &&
    typeof url === "string" &&
    isSensitiveSmsProviderRequest(url)
  ) {
    return null;
  }
  return breadcrumb;
}
