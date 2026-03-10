import ResizeImage from "@/components/pages/image-tools/resize";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Resize Image | Redec",
  description: "Change image dimensions with precise control",
};

export default function ResizeImagePage() {
  return (
    <Suspense fallback={<></>}>
      <ResizeImage />
    </Suspense>
  );
}
