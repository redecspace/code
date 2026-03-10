import PercentageCalculator from "@/components/pages/calculators/percentage";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Percentage Calculator | Redec",
  description: "Calculate percentages, percentage change, and ratios with ease",
};

export default function PercentagePage() {
  return (
    <Suspense fallback={<></>}>
      <PercentageCalculator />
    </Suspense>
  );
}
