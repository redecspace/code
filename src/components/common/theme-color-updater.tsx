"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const themeColor = resolvedTheme === "dark" ? "#151221" : "#ffffff";
    
    const existingMetas = document.querySelectorAll('meta[name="theme-color"]');
    let targetMeta: HTMLMetaElement | null = null;
    
    existingMetas.forEach((meta) => {
      // Remove meta tags with media queries to avoid conflicts (Next.js viewport generates these)
      if (meta.hasAttribute("media")) {
        meta.remove();
      } else {
        targetMeta = meta as HTMLMetaElement;
      }
    });

    if (!targetMeta) {
      targetMeta = document.createElement("meta");
      targetMeta.setAttribute("name", "theme-color");
      document.head.appendChild(targetMeta);
    }
    
    targetMeta.setAttribute("content", themeColor);
  }, [resolvedTheme]);

  return null;
}
