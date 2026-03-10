import { PDFDocument } from "pdf-lib";
import { _GSPS2PDF } from "@/lib/tools/pdf/gs/worker-init";

export interface SplitOptions {
  isGsMode?: boolean;
  startPage: number;
  endPage: number;
  onProgress?: (message: string) => void;
}

/**
 * Splits a PDF file by extracting a specific range of pages.
 * Supports standard pdf-lib splitting and Ghostscript WASM.
 */
export const splitPDFClient = async (
  arrayBuffer: ArrayBuffer,
  options: SplitOptions,
): Promise<Uint8Array> => {
  const { isGsMode, startPage, endPage, onProgress } = options;

  if (isGsMode) {
    onProgress?.("Please wait...");
    const psDataURL = URL.createObjectURL(
      new Blob([arrayBuffer], { type: "application/pdf" }),
    );

    try {
      const result = await _GSPS2PDF(
        {
          operation: "split",
          psDataURL,
          splitRange: {
            startPage: startPage.toString(),
            endPage: endPage.toString(),
          },
          showTerminalOutput: true,
        },
        undefined,
        (text) => onProgress?.(text),
      );

      if (result.error) throw new Error(result.error);

      const resp = await fetch(result.pdfDataURL);
      const outputBuffer = await resp.arrayBuffer();

      // Cleanup
      URL.revokeObjectURL(psDataURL);
      URL.revokeObjectURL(result.pdfDataURL);

      return new Uint8Array(outputBuffer);
    } catch (e) {
      URL.revokeObjectURL(psDataURL);
      console.error("[PDF-SPLIT] GS Mode failed:", e);
      throw e;
    }
  }

  // Standard pdf-lib Splitting
  onProgress?.("Loading source document...");
  const srcDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = srcDoc.getPageCount();

  // Validate range
  if (startPage < 1 || endPage > totalPages || startPage > endPage) {
    throw new Error(
      `Invalid page range: ${startPage}-${endPage}. Total pages: ${totalPages}`,
    );
  }

  onProgress?.(`Extracting pages ${startPage} to ${endPage}...`);
  const splitDoc = await PDFDocument.create();

  // pdf-lib indices are 0-based
  const pageIndices = [];
  for (let i = startPage - 1; i < endPage; i++) {
    pageIndices.push(i);
  }

  const copiedPages = await splitDoc.copyPages(srcDoc, pageIndices);
  copiedPages.forEach((page) => splitDoc.addPage(page));

  onProgress?.("Finalizing split document...");
  const splitBytes = await splitDoc.save({
    useObjectStreams: true,
  });

  return splitBytes;
};
