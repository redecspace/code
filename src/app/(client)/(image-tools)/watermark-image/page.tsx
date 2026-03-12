import WatermarkImage from "@/components/pages/image-tools/watermark";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Watermark Image | Redec",
  description: "Protect your images by adding text or logo watermarks easily",
};

export default function WatermarkPage() {
  return (
    <Suspense fallback={<></>}>
      <WatermarkImage />
    </Suspense>
  );
}
