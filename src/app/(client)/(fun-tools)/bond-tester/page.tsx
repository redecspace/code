import BondTester from "@/components/pages/fun-tools/bond-tester";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Bond Tester | Redec",
  description: "Analyze the deep, algorithmic nature of your friendship",
};

export default function BondTesterPage() {
  return (
    <Suspense fallback={<></>}>
      <BondTester />
    </Suspense>
  );
}
