import AboutPage from "@/components/pages/about";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Redec",
  description: "Learn more about Redec and our mission to provide free online tools.",
};

export default function Page() {
  return <AboutPage />;
}
