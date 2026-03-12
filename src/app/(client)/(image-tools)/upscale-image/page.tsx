import ImageUpscale from "@/components/pages/image-tools/upscale";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Image Upscale | Redec",
  description: "Enhance and enlarge your images using high-quality local processing",
};

export default function ImageUpscalePage() {
  return (
    <Suspense fallback={<></>}>
      <ImageUpscale />
    </Suspense>
  );
}
