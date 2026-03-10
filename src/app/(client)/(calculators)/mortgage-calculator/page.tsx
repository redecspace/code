import MortgageCalculator from "@/components/pages/calculators/mortgage";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Mortgage Calculator | Redec",
  description: "Calculate your monthly mortgage payments, including interest and total cost",
};

export default function MortgagePage() {
  return (
    <Suspense fallback={<></>}>
      <MortgageCalculator />
    </Suspense>
  );
}
