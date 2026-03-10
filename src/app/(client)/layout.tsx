"use client";

import { AppLayout } from "@/components/common/app-layout";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayout>
        {children}
    </AppLayout>
  );
}
