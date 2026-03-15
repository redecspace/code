import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import AppProviders from "./providers";
import { GTM_ID, SEO, WEB_URL } from "@/data/constants";
import { GoogleTagManager } from '@next/third-parties/google'

const fontDisplay = Montserrat({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "600", "500", "400", "300", "100", "200", "800", "900"],

});

const fontSans = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["700", "600", "500", "400", "300", "100", "200", "800", "900"],
});
export const metadata: Metadata = {
  metadataBase: new URL(WEB_URL),
  ...SEO.metadata,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#151221" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <GoogleTagManager gtmId={GTM_ID} />
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} tabular-nums font-sans`}
        cz-shortcut-listen="true"
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
