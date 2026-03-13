import CodeScreenshot from "@/components/pages/image-tools/code-screenshot";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Code Screenshot | Redec",
  description: "Create beautiful, shareable snapshots of your code with syntax highlighting",
};

export default function CodeScreenshotPage() {
  return (
    <Suspense fallback={<></>}>
      <CodeScreenshot />
    </Suspense>
  );
}
