import JSONToImage from "@/components/pages/image-tools/json-to-image";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "JSON to Image | Redec",
  description: "Convert JSON data into clean, readable images",
};

export default function JSONToImagePage() {
  return (
    <Suspense fallback={<></>}>
      <JSONToImage />
    </Suspense>
  );
}
