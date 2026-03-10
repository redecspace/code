import CropImage from "@/components/pages/image-tools/crop";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Crop Image | Redec",
  description: "Crop your images with custom aspect ratios or free-form selection",
};

export default function CropImagePage() {
  return (
    <Suspense fallback={<></>}>
      <CropImage />
    </Suspense>
  );
}
