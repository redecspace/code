import HTMLToImage from "@/components/pages/image-tools/html-to-image";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "HTML to Image | Redec",
  description: "Render and capture any HTML/CSS code snippet as a high-quality image",
};

export default function HTMLToImagePage() {
  return (
    <Suspense fallback={<></>}>
      <HTMLToImage />
    </Suspense>
  );
}
