import PDFToImage from "@/components/pages/image-tools/pdf-to-image";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "PDF to Image | Redec",
  description: "Convert every page of a PDF into a high-quality image instantly",
};

export default function PDFToImagePage() {
  return (
    <Suspense fallback={<></>}>
      <PDFToImage />
    </Suspense>
  );
}
