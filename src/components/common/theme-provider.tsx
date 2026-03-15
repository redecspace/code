"use client";

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";


export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      // disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}


export const useTheme = () => {
  const context = useNextTheme();
  return context;
};
