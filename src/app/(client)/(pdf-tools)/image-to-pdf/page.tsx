import ImageToPDF from "@/components/pages/pdf-tools/image-to-pdf";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Image to PDF | Redec",
  description: "Convert JPG, PNG and other images into professional PDF documents easily and securely in your browser",
};

export default function ImageToPDFPage() {
  return (
    <Suspense fallback={<></>}>
      <ImageToPDF />
    </Suspense>
  );
}
