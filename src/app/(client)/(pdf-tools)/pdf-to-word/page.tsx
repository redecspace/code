import PDFToWord from "@/components/pages/pdf-tools/pdf-to-word";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "PDF to Word | Redec",
  description: "Convert PDF documents into editable Word files easily and securely in your browser",
};

export default function PDFToWordPage() {
  return (
    <Suspense fallback={<></>}>
      <PDFToWord />
    </Suspense>
  );
}
