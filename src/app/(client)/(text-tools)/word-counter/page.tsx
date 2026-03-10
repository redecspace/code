import { Metadata } from "next";
import WordCounter from "@/components/pages/text-tools/word-counter";
import { APP_NAME, WEB_URL } from "@/data/constants";

export const metadata: Metadata = {
  title: `Word Counter | ${APP_NAME}`,
  description:
    "Free online word counter and text analyzer. Count words, characters, sentences, reading time, and calculate Flesch Reading Ease score.",
  alternates: {
    canonical: `${WEB_URL}/word-counter`,
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Word Counter",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    url: `${WEB_URL}/word-counter`,
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
      <WordCounter />
    </>
  );
}
