import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  if (
    process.env.IS_STAGING === "true" ||
    process.env.VERCEL_GIT_COMMIT_REF === "develop"
  ) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/api", "/design-system"],
    },
    sitemap: "https://plus.eqourse.com/sitemap.xml",
    host: "https://plus.eqourse.com",
  };
}
