import { Metadata } from "next";
import Home from "@/components/pages/home";
import { APP_NAME, WEB_URL } from "@/data/constants";

export const metadata: Metadata = {
  title: `Free Tools for you | ${APP_NAME}`,
  description:
    "A growing collection of useful tools — fast, free, and open source. Convert, generate, create, calculate and analyze effortlessly.",
  alternates: {
    canonical: WEB_URL,
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    url: WEB_URL,
    description: metadata.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${WEB_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Home />
    </>
  );
}
