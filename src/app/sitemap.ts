import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().replace(/\/$/, "");
  const now = new Date();

  const paths = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/pricing", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/faq", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/sign-in", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/sign-up", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/terms", changeFrequency: "yearly" as const, priority: 0.4 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.4 },
    { path: "/cookies", changeFrequency: "yearly" as const, priority: 0.4 },
  ];

  return paths.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
