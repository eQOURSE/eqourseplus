import type { MetadataRoute } from "next";

import { RESOLVING_ROUTES } from "./public-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  return RESOLVING_ROUTES.map((route) => ({
    url: new URL(route, "https://plus.eqourse.com").href,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
