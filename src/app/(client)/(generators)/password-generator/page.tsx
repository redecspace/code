import { Metadata } from "next";
import PasswordGenerator from "@/components/pages/generators/password-generator";
import { APP_NAME, WEB_URL } from "@/data/constants";

export const metadata: Metadata = {
  title: `Password Generator | ${APP_NAME}`,
  description:
    "Generate secure, random passwords instantly. Customize length and character types for maximum security.",
  alternates: {
    canonical: `${WEB_URL}/password-generator`,
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Password Generator",
    applicationCategory: "SecurityApplication",
    operatingSystem: "Any",
    url: `${WEB_URL}/password-generator`,
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
      <PasswordGenerator />
    </>
  );
}
