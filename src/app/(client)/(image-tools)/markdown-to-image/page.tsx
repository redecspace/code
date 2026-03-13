import MarkdownToImage from "@/components/pages/image-tools/markdown-to-image";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Markdown to Image | Redec",
  description: "Transform Markdown text into stylish images",
};

export default function MarkdownToImagePage() {
  return (
    <Suspense fallback={<></>}>
      <MarkdownToImage />
    </Suspense>
  );
}
