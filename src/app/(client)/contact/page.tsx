import ContactPage from "@/components/pages/contact";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Redec",
  description: "Get in touch with the Redec team for support or feedback.",
};

export default function Page() {
  return <ContactPage />;
}
