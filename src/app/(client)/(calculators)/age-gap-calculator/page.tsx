import AgeGapCalculator from "@/components/pages/calculators/age-gap";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Age Gap Calculator | Redec",
  description: "Calculate the age difference between two people and discover relationship insights like the half-your-age-plus-seven rule",
};

export default function AgeGapPage() {
  return (
    <Suspense fallback={<></>}>
      <AgeGapCalculator />
    </Suspense>
  );
}
