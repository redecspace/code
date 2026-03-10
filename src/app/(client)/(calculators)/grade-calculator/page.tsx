import GradeCalculator from "@/components/pages/calculators/grade";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Grade Calculator | Redec",
  description: "Calculate your weighted course grade and find out what you need on your final exam",
};

export default function GradePage() {
  return (
    <Suspense fallback={<></>}>
      <GradeCalculator />
    </Suspense>
  );
}
