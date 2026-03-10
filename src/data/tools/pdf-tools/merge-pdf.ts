import { Combine } from "lucide-react";

export const MERGE_PDF_CONTENT = {
  title: "Merge PDF",
  description: "Combine multiple PDF documents into a single file easily",
  about: [
    "Our Merge PDF tool allows you to combine multiple PDF documents into one single file. This is perfect for organizing project files, combining reports, or bringing together different sections of a document.",
    "The process happens entirely within your browser. Your files are never uploaded to any server, ensuring 100% privacy and security for your sensitive documents."
  ],
  features: [
    { title: "Browser-side Merging", description: "Documents are processed locally for maximum privacy." },
    { title: "Custom Order", description: "Arrange your PDF files in any sequence you want before merging." },
    { title: "Fast & Secure", description: "No server-side uploads or wait times. Your data stays on your device." },
    { title: "Premium Mode", description: "Use Ghostscript WASM for high-performance professional merging." }
  ],
  steps: [
    { step: "1", title: "Select Files", description: "Choose the PDF files you want to combine from your device." },
    { step: "2", title: "Arrange Order", description: "Drag and reorder the files to set the perfect sequence." },
    { step: "3", title: "Merge & Download", description: "Click 'Merge' and save your unified PDF instantly." }
  ],
  icon: Combine
};
