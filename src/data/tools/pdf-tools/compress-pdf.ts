import { Minimize2 } from "lucide-react";

export const COMPRESS_PDF_CONTENT = {
  title: "Compress PDF",
  description: "Reduce PDF file size without significantly losing quality",
  about: [
    "Our Compress PDF tool allows you to reduce the file size of your documents while maintaining an optimal balance between quality and size. This is essential for meeting email attachment limits, saving storage space, and speeding up document uploads.",
    "The compression process is performed entirely within your browser. Your files are never uploaded to any server, ensuring 100% privacy and security for your sensitive documents."
  ],
  features: [
    { title: "Smart Compression", description: "Reduces size while preserving text and image clarity." },
    { title: "Browser Security", description: "Processing happens locally; no files are uploaded." },
    { title: "Instant Results", description: "See exactly how much space you've saved." },
    { title: "Batch Processing", description: "Efficiently handle large documents in seconds." }
  ],
  steps: [
    { step: "1", title: "Upload PDF", description: "Select the large PDF file you want to compress." },
    { step: "2", title: "Compress", description: "Click the compress button to start the optimization." },
    { step: "3", title: "Download", description: "Download your new, smaller PDF document instantly." }
  ],
  icon: Minimize2
};
