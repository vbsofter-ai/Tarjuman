import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/src/lib/app-url";
import { VERTICALS } from "@/src/lib/verticals";

/**
 * Dynamic sitemap.xml. Generated at request time so we always include
 * the latest marketing pages without a separate build step.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppOrigin();
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/solutions`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];
  const verticalPages: MetadataRoute.Sitemap = VERTICALS.map((v) => ({
    url: `${base}/solutions/${v.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  return [...staticPages, ...verticalPages];
}
