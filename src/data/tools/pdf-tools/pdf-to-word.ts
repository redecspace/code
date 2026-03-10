import { FileText } from "lucide-react";

export const PDF_TO_WORD_CONTENT = {
  title: "PDF to Word",
  description: "Convert your PDF documents into editable Word files instantly",
  about: [
    "Our PDF to Word tool uses advanced text extraction technology to transform your static PDF documents into editable Microsoft Word files (.docx).",
    "The entire conversion happens locally in your browser. Your sensitive documents never touch our servers, ensuring absolute privacy and compliance with data security standards."
  ],
  features: [
    { title: "Text Preservation", description: "Accurately extracts text content and basic formatting from your PDF files." },
    { title: "100% Private", description: "Documents are processed on your device. No data is ever uploaded to the cloud." },
    { title: "Fast Conversion", description: "Convert multi-page documents in seconds without waiting for server queues." },
    { title: "Standard & Premium", description: "Use our high-speed extraction engine or advanced layout analysis." }
  ],
  steps: [
    { step: "1", title: "Select PDF", description: "Choose the PDF document you want to convert from your computer or mobile." },
    { step: "2", title: "Analyze Layout", description: "Our engine scans the document structure to identify paragraphs and formatting." },
    { step: "3", title: "Download DOCX", description: "Download your newly created Word file and start editing immediately." }
  ],
  icon: FileText
};
