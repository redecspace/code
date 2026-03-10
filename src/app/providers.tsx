"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/common/theme-provider";
import { Toaster } from "sonner";
import {SerwistProvider} from "@serwist/next/react";

export default function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only register the service worker in production to avoid 404s and lag in dev
  const swUrl ="/sw.js"

  return (
    <SerwistProvider swUrl={swUrl}>
      <ThemeProvider defaultTheme="dark" storageKey="redec-theme">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </SerwistProvider>
  );
}
