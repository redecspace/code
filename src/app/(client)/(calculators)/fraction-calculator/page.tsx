import FractionCalculator from "@/components/pages/calculators/fraction";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Fraction Calculator | Redec",
  description: "Add, subtract, multiply and divide fractions with our free online calculator",
};

export default function FractionPage() {
  return (
    <Suspense fallback={<></>}>
      <FractionCalculator />
    </Suspense>
  );
}
