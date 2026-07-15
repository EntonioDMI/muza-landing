import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://muza.lol/", changeFrequency: "weekly", priority: 1 },
    { url: "https://muza.lol/privacy", changeFrequency: "monthly", priority: 0.3 },
  ];
}
