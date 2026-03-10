import RotateImage from "@/components/pages/image-tools/rotate";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Rotate Image | Redec",
  description: "Rotate or flip images to any orientation",
};

export default function RotateImagePage() {
  return (
    <Suspense fallback={<></>}>
      <RotateImage />
    </Suspense>
  );
}
