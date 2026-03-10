import BMICalculator from "@/components/pages/calculators/bmi";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "BMI Calculator | Redec",
  description: "Calculate your body mass index (BMI) and find your health category using metric or imperial units",
};

export default function BMIPage() {
  return (
    <Suspense fallback={<></>}>
      <BMICalculator />
    </Suspense>
  );
}
