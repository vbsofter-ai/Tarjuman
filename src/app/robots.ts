import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/src/lib/app-url";

/**
 * Dynamic robots.txt. Allows all crawlers in production; in non-production
 * (e.g. localhost), disallows everything to avoid polluting search results
 * with the dev URL.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getAppOrigin();
  const isProd = base.startsWith("https://") && !base.includes("localhost");
  if (!isProd) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/billing/cancel", "/billing/success"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
