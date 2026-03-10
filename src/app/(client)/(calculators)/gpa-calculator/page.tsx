import GPACalculator from "@/components/pages/calculators/gpa";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "GPA Calculator | Redec",
  description: "Calculate your semester and cumulative GPA with our free college GPA calculator",
};

export default function GPAPage() {
  return (
    <Suspense fallback={<></>}>
      <GPACalculator />
    </Suspense>
  );
}
