import { Image as ImageIcon } from "lucide-react";

export const IMAGE_TO_PDF_CONTENT = {
  title: "Image to PDF",
  description: "Convert your photos and images into professional PDF documents",
  about: [
    "Our Image to PDF tool allows you to convert multiple images (JPG, PNG, WebP) into a single, high-quality PDF document. This is ideal for scanning documents, creating digital portfolios, or combining photo evidence into a single file.",
    "The conversion process happens entirely within your browser. Your images are never uploaded to any server, ensuring 100% privacy and security for your personal data."
  ],
  features: [
    { title: "Multi-image Support", description: "Combine dozens of images into a single unified PDF." },
    { title: "Custom Margins", description: "Adjust page padding for a professional layout." },
    { title: "File Reordering", description: "Drag and drop your images to set the perfect page sequence." },
    { title: "Filters & Editing", description: "Apply grayscale or sharpen filters to enhance your scans." }
  ],
  steps: [
    { step: "1", title: "Add Images", description: "Upload the images you want to include in the PDF." },
    { step: "2", title: "Arrange & Edit", description: "Reorder pages and apply filters to your images." },
    { step: "3", title: "Convert", description: "Generate and download your final PDF document." }
  ],
  icon: ImageIcon
};
