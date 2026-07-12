import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/siteConfig";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep the logged-in app and auth screens out of search indexes —
      // they hold user data, not publisher content.
      disallow: [
        "/dashboard",
        "/attendance",
        "/subjects",
        "/timetable",
        "/analytics",
        "/friends",
        "/settings",
        "/login",
        "/register",
        "/forgot-password",
        "/api/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
