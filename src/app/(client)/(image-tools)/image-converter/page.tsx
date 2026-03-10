import ImageConverter from "@/components/pages/image-tools/converter";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Image Converter | Redec",
  description: "Convert images between JPG, PNG, WebP, and other formats",
};

export default function ImageConverterPage() {
  return (
    <Suspense fallback={<></>}>
      <ImageConverter />
    </Suspense>
  );
}
