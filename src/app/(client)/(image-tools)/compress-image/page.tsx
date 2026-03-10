import CompressImage from "@/components/pages/image-tools/compress";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Compress Image | Redec",
  description: "Reduce image file size without losing quality",
};

export default function CompressImagePage() {
  return (
    <Suspense fallback={<></>}>
      <CompressImage />
    </Suspense>
  );
}
