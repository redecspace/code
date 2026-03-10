import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import imageCompression from "browser-image-compression";
import { _GSPS2PDF } from "@/lib/tools/pdf/gs/worker-init";

export interface CompressionOptions {
  tier: "less" | "medium" | "extreme" | "custom";
  isGsMode?: boolean;
  targetSizeKb?: number;
  onProgress?: (message: string) => void;
}

/**
 * Re-compresses image data using browser-image-compression.
 */
const recompressImage = async (
  rawData: Uint8Array,
  tier: "less" | "medium" | "extreme" | "custom",
): Promise<Uint8Array | null> => {
  try {
    const blob = new Blob([rawData as any]);
    const file = new File([blob], "image.jpg", { type: "image/jpeg" });

    const options = {
      maxSizeMB: tier === "extreme" ? 0.1 : 0.5,
      maxWidthOrHeight: tier === "extreme" ? 800 : 1600,
      useWebWorker: true,
      initialQuality: tier === "extreme" ? 0.3 : 0.7,
      fileType: "image/jpeg",
    };

    const compressedBlob = await imageCompression(file, options);
    const arrayBuffer = await compressedBlob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.warn("[PDF-HYBRID] Image re-compression failed:", error);
    return null;
  }
};

/**
 * Main Hybrid PDF compression engine (Client-side)
 * Now supports Ghostscript mode via WASM workers.
 */
export const compressPDFClient = async (
  arrayBuffer: ArrayBuffer,
  options: CompressionOptions,
): Promise<Uint8Array> => {
  const { tier, isGsMode, targetSizeKb, onProgress } = options;
  // const startTime = Date.now();

  if (isGsMode) {
    console.log(`\n[PDF-GS-WASM] Starting GS compression...`);
    onProgress?.("Please Wait...");

    // Default presets based on tier
    let gsPreset: string | null =
      tier === "less" ? "/printer" : tier === "medium" ? "/ebook" : "/screen";
    let customCommand: string | null = null;

    // Handle target size if provided (min 50kb as requested in UI logic)
    if (targetSizeKb && targetSizeKb >= 50) {
      const currentSizeKb = arrayBuffer.byteLength / 1024;
      const ratio = targetSizeKb / currentSizeKb;

      // Calculate target DPI based on size ratio (heuristic)
      // 300 DPI -> 100%, 72 DPI -> 25% approx
      let targetDpi = Math.round(300 * Math.sqrt(ratio));
      targetDpi = Math.max(50, Math.min(300, targetDpi));

      console.log(
        `[PDF-GS-WASM] Target: ${targetSizeKb}KB | Ratio: ${ratio.toFixed(2)} | DPI: ${targetDpi}`,
      );

      gsPreset = null; // Override preset
      customCommand = `-sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dColorImageResolution=${targetDpi} -dGrayImageResolution=${targetDpi} -dMonoImageResolution=${targetDpi} -dDownsampleColorImages=true -dDownsampleGrayImages=true -dDownsampleMonoImages=true -dNOPAUSE -dQUIET -dBATCH -sOutputFile=output.pdf input.pdf`;
    }

    const psDataURL = URL.createObjectURL(
      new Blob([arrayBuffer], { type: "application/pdf" }),
    );

    try {
      const result = await _GSPS2PDF(
        {
          operation: "compress",
          psDataURL,
          pdfSetting: gsPreset || undefined,
          customCommand,
          showTerminalOutput: true,
        },
        undefined,
        (text) => onProgress?.(text),
      );

      if (result.error) throw new Error(result.error);

      const resp = await fetch(result.pdfDataURL);
      const outputBuffer = await resp.arrayBuffer();

      URL.revokeObjectURL(psDataURL);
      URL.revokeObjectURL(result.pdfDataURL);

      console.log(
        `[PDF-GS-WASM] DONE! Saved: ${(((arrayBuffer.byteLength - outputBuffer.byteLength) / arrayBuffer.byteLength) * 100).toFixed(1)}%`,
      );
      return new Uint8Array(outputBuffer);
    } catch (e) {
      URL.revokeObjectURL(psDataURL);
      throw e;
    }
  }

  // STANDARD HYBRID LOGIC
  console.log(`\n[PDF-HYBRID] Starting ${tier.toUpperCase()} compression...`);
  onProgress?.("Loading PDF document...");

  const pdfDoc = await PDFDocument.load(arrayBuffer);

  if (tier !== "less") {
    const indirectObjects = pdfDoc.context.enumerateIndirectObjects();
    const images = indirectObjects.filter(([_, obj]) => {
      if (!(obj instanceof PDFRawStream)) return false;
      const subtype = obj.dict.get(PDFName.of("Subtype"));
      return subtype?.toString() === "/Image";
    });

    let optimizedCount = 0;
    for (const [ref, obj] of images) {
      const current = images.indexOf([ref, obj]) + 1;
      onProgress?.(`Optimizing image ${current} of ${images.length}...`);

      const stream = obj as PDFRawStream;
      const rawData = stream.getContents();

      if (!rawData || rawData.length < 100) continue;

      const optimizedData = await recompressImage(rawData, tier);

      if (optimizedData && optimizedData.length < rawData.length * 0.95) {
        const newDict = stream.dict.clone();
        newDict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
        newDict.set(
          PDFName.of("Length"),
          pdfDoc.context.obj(optimizedData.length),
        );

        const newStream = PDFRawStream.of(newDict, optimizedData);
        pdfDoc.context.assign(ref, newStream);
        optimizedCount++;
      }
    }
  }

  onProgress?.("Finalizing document...");
  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  return compressedBytes;
};
