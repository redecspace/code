import { MetadataRoute } from "next";
import { WEB_URL } from "@/data/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${WEB_URL}/sitemap.xml`,
  };
}
