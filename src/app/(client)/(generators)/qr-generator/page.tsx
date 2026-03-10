import { Metadata } from "next";
import QrGenerator from "@/components/pages/generators/qr-generator";
import { APP_NAME, WEB_URL } from "@/data/constants";

export const metadata: Metadata = {
  title: `QR Code Generator | ${APP_NAME}`,
  description:
    "Create custom QR codes from URLs or text for free. Download high-quality PNGs with customizable foreground and background colors.",
  alternates: {
    canonical: `${WEB_URL}/qr-generator`,
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "QR Code Generator",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    url: `${WEB_URL}/qr-generator`,
    description: metadata.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <QrGenerator />
    </>
  );
}
