import { MetadataRoute } from "next";
import { WEB_URL } from "@/data/constants";
import { tools } from "@/data/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolEntries = tools.flatMap((category) =>
    category.items.map((item) => ({
      url: `${WEB_URL}${item.url}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  return [
    {
      url: WEB_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...toolEntries,
  ];
}
