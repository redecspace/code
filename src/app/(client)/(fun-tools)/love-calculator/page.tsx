import LoveCalculator from "@/components/pages/fun-tools/love-calculator";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Love Calculator | Redec",
  description: "Test the romantic compatibility between two names",
};

export default function LoveCalculatorPage() {
  return (
    <Suspense fallback={<></>}>
      <LoveCalculator />
    </Suspense>
  );
}
