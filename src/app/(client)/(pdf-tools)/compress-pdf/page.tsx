import CompressPDF from "@/components/pages/pdf-tools/compress-pdf";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Compress PDF | Redec",
  description: "Reduce PDF file size without losing quality easily and securely in your browser",
};

export default function CompressPage() {
  return (
    <Suspense fallback={<></>}>
      <CompressPDF />
    </Suspense>
  );
}
