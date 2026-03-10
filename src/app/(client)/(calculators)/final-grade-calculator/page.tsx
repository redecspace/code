import FinalGradeCalculator from "@/components/pages/calculators/final-grade";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Final Grade Calculator | Redec",
  description: "Determine what score you need on your final exam to achieve your target course grade",
};

export default function FinalGradePage() {
  return (
    <Suspense fallback={<></>}>
      <FinalGradeCalculator />
    </Suspense>
  );
}
