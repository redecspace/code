import ImageScanner from "@/components/pages/image-tools/scanner";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Image Scanner | Redec",
  description: "Scan documents and images with intelligent cropping",
};

export default function ImageScannerPage() {
  return (
    <Suspense fallback={<></>}>
      <ImageScanner />
    </Suspense>
  );
}
