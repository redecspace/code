import OCRImage from "@/components/pages/image-tools/ocr";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Image to Text (OCR) | Redec",
  description: "Extract text from images using high-precision OCR",
};

export default function ImageToTextPage() {
  return (
    <Suspense fallback={<></>}>
      <OCRImage />
    </Suspense>
  );
}
