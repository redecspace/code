import { PDFDocument } from "pdf-lib";
import { _GSPS2PDF } from "@/lib/tools/pdf/gs/worker-init";

export interface MergeOptions {
  isGsMode?: boolean;
  onProgress?: (message: string) => void;
}

/**
 * Merges multiple PDF files into one.
 * Supports standard pdf-lib merging and Ghostscript WASM.
 */
export const mergePDFClient = async (
  files: { url: string; arrayBuffer: ArrayBuffer }[],
  options: MergeOptions = {},
): Promise<Uint8Array> => {
  const { isGsMode, onProgress } = options;

  if (isGsMode) {
    onProgress?.("Please wait...");
    try {
      const result = await _GSPS2PDF(
        {
          operation: "merge",
          files: files.map((f) => f.url),
          pdfSetting: "/ebook", // Balanced default for merge
          showTerminalOutput: true,
        },
        undefined,
        (text) => onProgress?.(text),
      );

      if (result.error) throw new Error(result.error);

      const resp = await fetch(result.pdfDataURL);
      const outputBuffer = await resp.arrayBuffer();

      // Cleanup URLs if they were temporary
      URL.revokeObjectURL(result.pdfDataURL);

      return new Uint8Array(outputBuffer);
    } catch (e) {
      console.error("[PDF-MERGE] GS Mode failed, check worker.", e);
      throw e;
    }
  }

  // Standard pdf-lib Merging
  onProgress?.("Creating new document...");
  const mergedDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    onProgress?.(`Merging file ${i + 1} of ${files.length}...`);
    const donorDoc = await PDFDocument.load(files[i].arrayBuffer);
    const copiedPages = await mergedDoc.copyPages(
      donorDoc,
      donorDoc.getPageIndices(),
    );
    copiedPages.forEach((page) => mergedDoc.addPage(page));
  }

  onProgress?.("Finalizing merged document...");
  const mergedBytes = await mergedDoc.save({
    useObjectStreams: true,
  });

  return mergedBytes;
};
