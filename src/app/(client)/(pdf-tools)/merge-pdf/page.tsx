import MergePDF from "@/components/pages/pdf-tools/merge-pdf";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Merge PDF | Redec",
  description: "Combine multiple PDF files into one document easily and securely in your browser",
};

export default function MergePage() {
  return (
    <Suspense fallback={<></>}>
      <MergePDF />
    </Suspense>
  );
}
