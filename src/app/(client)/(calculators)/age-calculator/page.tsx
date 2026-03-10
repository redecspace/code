import AgeCalculator from "@/components/pages/calculators/age";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Age Calculator | Redec",
  description: "Calculate your exact age in years, months, and days with our free tool",
};

export default function AgePage() {
  return (
    <Suspense fallback={<></>}>
      <AgeCalculator />
    </Suspense>
  );
}
