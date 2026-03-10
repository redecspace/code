import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { OCRClient } from "tesseract-wasm";

import { createWorker } from "tesseract.js";

export interface OCROptions {
  OCRref?: any;
  mode: "standard" | "premium";
  onProgress?: (message: string) => void;
}

export const extractTextFromImage = async (
  imageFile: File,
  options: OCROptions,
): Promise<string> => {
  const { mode, onProgress } = options;

  if (mode === "premium") {
    onProgress?.("Please wait...");

    // use tesseract-wasm for premium
    if (!options.OCRref?.current) {
      options.OCRref.current = new OCRClient();

      await options.OCRref.current.loadModel("https://huggingface.co/datasets/redecspace/serve/resolve/main/image-ocr/eng.traineddata");
    }

    const ocr = options.OCRref.current;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          onProgress?.("Processing image...");
          await ocr.loadImage(reader.result as ArrayBuffer);
          onProgress?.("Extracting text...");
          const text = await ocr.getText();
          resolve(text || "");
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsArrayBuffer(imageFile);
    });
  } else {
    onProgress?.("Please wait...");
    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.(`Recognizing: ${Math.round(m.progress * 100)}%`);
        } else {
          onProgress?.(m.status.replace(/_/g, " "));
        }
      },
    });

    const imageUrl = URL.createObjectURL(imageFile);
    const {
      data: { text },
    } = await worker.recognize(imageUrl);
    await worker.terminate();
    URL.revokeObjectURL(imageUrl);

    return text;
  }
};

export const exportToPDF = async (text: string): Promise<Blob> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const fontSize = 11;
  const margin = 50;
  const maxWidth = width - margin * 2;

  // Real-world text wrapping logic
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    let currentLine = "";
    const words = paragraph.split(/\s+/);
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
  }

  let y = height - margin;

  for (const line of lines) {
    if (y < margin) {
      // Very basic multi-page could be added here, but for now we truncate
      page.drawText(
        "... (continues on next page - truncated in this preview)",
        { x: margin, y: margin / 2, size: 8, font },
      );
      break;
    }
    if (line.trim()) {
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
    y -= fontSize + 4;
  }

  const pdfBytes = await pdfDoc.save();
  // Fixing the Uint8Array buffer compatibility error
  return new Blob([Buffer.from(pdfBytes)], { type: "application/pdf" });
};

export const exportToWord = async (text: string): Promise<Blob> => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: text.split("\n").map(
          (line) =>
            new Paragraph({
              children: [new TextRun(line)],
            }),
        ),
      },
    ],
  });

  return await Packer.toBlob(doc);
};

export const exportToExcel = async (text: string): Promise<Blob> => {
  // Simple CSV as Excel fallback
  const csvContent = text
    .split("\n")
    .map((line) => `"${line.replace(/"/g, '""')}"`)
    .join("\n");
  return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
};
