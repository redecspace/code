import RemoveBackground from "@/components/pages/image-tools/remove-bg";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Remove Background | Redec",
  description: "Automatically extract subjects from images with high precision",
};

export default function RemoveBackgroundPage() {
  return (
    <Suspense fallback={<></>}>
      <RemoveBackground />
    </Suspense>
  );
}
