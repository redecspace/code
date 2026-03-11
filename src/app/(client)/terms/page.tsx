import TermsPage from "@/components/pages/terms";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Redec",
  description: "Read our terms of service to understand the guidelines for using Redec.",
};

export default function Page() {
  return <TermsPage />;
}
