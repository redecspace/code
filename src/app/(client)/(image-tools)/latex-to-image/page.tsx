import LaTeXToImage from "@/components/pages/image-tools/latex-to-image";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "LaTeX to Image | Redec",
  description: "Render complex mathematical formulas and equations into high-quality images",
};

export default function LaTeXToImagePage() {
  return (
    <Suspense fallback={<></>}>
      <LaTeXToImage />
    </Suspense>
  );
}
