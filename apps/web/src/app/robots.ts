import type { MetadataRoute } from "next";
import { appUrl } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/admin", "/api", "/login", "/signup", "/unsubscribe"],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
