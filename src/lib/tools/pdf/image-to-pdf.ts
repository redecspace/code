import { PDFDocument, PageSizes } from 'pdf-lib';

export interface ImageToPDFOptions {
  pageSize: "A4" | "LETTER" | "ORIGINAL";
  margin: number;
  onProgress?: (message: string) => void;
}

export interface ProcessedImage {
  id: string;
  name: string;
  blob: Blob;
  previewUrl: string;
  filter: "none" | "grayscale" | "sharpen";
}

/**
 * Converts a list of processed images into a single PDF document.
 */
export const convertImagesToPDF = async (
  images: ProcessedImage[],
  options: ImageToPDFOptions
): Promise<Uint8Array> => {
  const { pageSize, margin, onProgress } = options;
  
  onProgress?.("Initializing PDF document...");
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < images.length; i++) {
    onProgress?.(`Adding page ${i + 1} of ${images.length}...`);
    
    const img = images[i];
    const imageBytes = await img.blob.arrayBuffer();
    
    let pdfImage;
    if (img.blob.type === 'image/jpeg') {
      pdfImage = await pdfDoc.embedJpg(imageBytes);
    } else {
      pdfImage = await pdfDoc.embedPng(imageBytes);
    }

    const { width: imgWidth, height: imgHeight } = pdfImage.scale(1);
    
    // Determine page size
    let pageWidth = imgWidth + (margin * 2);
    let pageHeight = imgHeight + (margin * 2);

    if (pageSize === "A4") {
      [pageWidth, pageHeight] = PageSizes.A4;
    } else if (pageSize === "LETTER") {
      [pageWidth, pageHeight] = PageSizes.Letter;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate dimensions to fit image within margins while preserving aspect ratio
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);
    
    const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    // Center image
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    page.drawImage(pdfImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  onProgress?.("Finalizing PDF...");
  return await pdfDoc.save({ useObjectStreams: true });
};
