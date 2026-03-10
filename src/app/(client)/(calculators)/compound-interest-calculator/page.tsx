import CompoundInterestCalculator from "@/components/pages/calculators/compound-interest";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Compound Interest Calculator | Redec",
  description: "Calculate how your money grows over time with the power of compound interest",
};

export default function CompoundInterestPage() {
  return (
    <Suspense fallback={<></>}>
      <CompoundInterestCalculator />
    </Suspense>
  );
}
