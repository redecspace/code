import { Scissors } from "lucide-react";

export const SPLIT_PDF_CONTENT = {
  title: "Split PDF",
  description: "Extract specific pages or ranges from a PDF document",
  about: [
    "Our Split PDF tool gives you the flexibility to take a large document and break it down into smaller, more manageable parts. Whether you need to extract a single page or split a document by ranges, we've got you covered.",
    "The entire process happens within your browser. Your files are never uploaded to any server, ensuring 100% privacy and security for your sensitive documents."
  ],
  features: [
    { title: "Page Range Extraction", description: "Define a start and end page to create a new PDF from that range." },
    { title: "Standard & Premium", description: "Use our high-speed local engine or the professional Ghostscript WASM engine." },
    { title: "Local Processing", description: "Privacy is guaranteed as no data ever leaves your device." },
    { title: "Fast & Secure", description: "No server wait times; get your split document instantly." }
  ],
  steps: [
    { step: "1", title: "Upload PDF", description: "Select the PDF document you want to split." },
    { step: "2", title: "Define Range", description: "Enter the starting and ending page numbers for your extraction." },
    { step: "3", title: "Split & Download", description: "Click 'Split PDF' and save your new document immediately." }
  ],
  icon: Scissors
};
