"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === "dark" ? "#151221" : "#ffffff";
    
    const updateMeta = () => {
      // Remove existing to force a clean "re-read" by the browser
      const existingMetas = document.querySelectorAll('meta[name="theme-color"]');
      existingMetas.forEach(m => m.remove());

      const meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("content", color);
      document.head.appendChild(meta);

      // Force a layout "nudge" similar to what happens when opening a sidebar.
      // We briefly toggle a style property to trigger a browser UI refresh.
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      // Force a reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      document.body.offsetHeight; 
      document.body.style.overflow = originalOverflow;
    };

    updateMeta();
    
    // Some browsers need a tiny delay to register the theme change first
    const timer = setTimeout(updateMeta, 10);
    
    return () => clearTimeout(timer);
  }, [resolvedTheme]);

  return null;
}
