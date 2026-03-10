import { Metadata } from "next";
import UnitConverter from "@/components/pages/converters/unit-converter";
import { APP_NAME, WEB_URL } from "@/data/constants";

export const metadata: Metadata = {
  title: `Unit Converter | ${APP_NAME}`,
  description:
    "Free online unit converter. Quickly and easily convert between lengths, weights, temperatures, speeds, and volumes.",
  alternates: {
    canonical: `${WEB_URL}/unit-converter`,
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Unit Converter",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    url: `${WEB_URL}/unit-converter`,
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
      <UnitConverter />
    </>
  );
}
