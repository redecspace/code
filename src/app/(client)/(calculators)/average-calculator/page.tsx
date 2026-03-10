import AverageCalculator from "@/components/pages/calculators/average";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Average Calculator | Redec",
  description: "Calculate mean, median, mode, and range for any set of numbers",
};

export default function AveragePage() {
  return (
    <Suspense fallback={<></>}>
      <AverageCalculator />
    </Suspense>
  );
}
