import SplitPDF from "@/components/pages/pdf-tools/split-pdf";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Split PDF | Redec",
  description: "Extract pages or split one PDF into multiple files easily and securely in your browser",
};

export default function SplitPage() {
  return (
    <Suspense fallback={<></>}>
      <SplitPDF />
    </Suspense>
  );
}
