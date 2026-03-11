import PrivacyPage from "@/components/pages/privacy";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Redec",
  description: "Read our privacy policy to understand how we protect your data.",
};

export default function Page() {
  return <PrivacyPage />;
}
