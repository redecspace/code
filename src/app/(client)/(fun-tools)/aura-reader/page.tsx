import AuraReader from "@/components/pages/fun-tools/aura-reader";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Aura Reader | Redec",
  description: "Discover the color of your energy based on your name and mood",
};

export default function AuraReaderPage() {
  return (
    <Suspense fallback={<></>}>
      <AuraReader />
    </Suspense>
  );
}
