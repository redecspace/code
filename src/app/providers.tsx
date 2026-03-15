"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/common/theme-provider";
import { Toaster } from "sonner";
import { SerwistProvider } from "@serwist/next/react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();

export default function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only register the service worker in production to avoid 404s and lag in dev
  const swUrl = "/sw.js";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
       defaultTheme="system"
       enableSystem
       storageKey="redec-theme" 
      >
        <SerwistProvider swUrl={swUrl}>
          <TooltipProvider>
            {children}
            <Toaster className="font-sans!" />
          </TooltipProvider>
        </SerwistProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
