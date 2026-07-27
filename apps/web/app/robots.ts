import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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
