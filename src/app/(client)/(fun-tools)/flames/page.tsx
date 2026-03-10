import Flames from "@/components/pages/fun-tools/flames";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "FLAMES Game | Redec",
  description: "Discover your relationship status with the classic FLAMES game",
};

export default function FlamesPage() {
  return (
    <Suspense fallback={<></>}>
      <Flames />
    </Suspense>
  );
}
