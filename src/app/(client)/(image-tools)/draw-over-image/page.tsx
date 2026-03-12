import DrawOverImage from "@/components/pages/image-tools/draw-over-image";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Draw Over Image | Redec",
  description: "Annotate, draw, or add shapes over any image",
};

export default function AddOverImagePage() {
  return (
    <Suspense fallback={<></>}>
      <DrawOverImage />
    </Suspense>
  );
}
