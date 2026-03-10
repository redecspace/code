import AspectRatioCalculator from "@/components/pages/calculators/aspect-ratio";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Aspect Ratio Calculator | Redec",
  description: "Calculate screen dimensions and aspect ratios for video, photography, and screens",
};

export default function AspectRatioPage() {
  return (
    <Suspense fallback={<></>}>
      <AspectRatioCalculator />
    </Suspense>
  );
}
