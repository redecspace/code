import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const levelStr = formData.get("level") as string | null;

    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Please upload a valid PDF file" }, { status: 400 });
    }

    const levelNum = levelStr ? parseInt(levelStr, 10) : 50;
    let preset: "less" | "balanced" | "max" = "balanced";
    if (levelNum < 33) preset = "less";
    else if (levelNum > 66) preset = "max";

    console.log(`\n[PDF-ENGINE] >>> Starting: ${file.name}`);
    console.log(`[PDF-ENGINE] Level: ${levelNum}% | Tier: ${preset.toUpperCase()}`);

    const buffer = await file.arrayBuffer();
    const originalSize = buffer.byteLength;

    // Load PDF
    const pdfDoc = await PDFDocument.load(buffer);
    
    // IMAGE PASS: For Medium and Extreme (Max)
    if (preset !== "less") {
      console.log(`[PDF-ENGINE] Running Deep Sharp Scan...`);
      const quality = preset === "balanced" ? 65 : 25;
      const indirectObjects = pdfDoc.context.enumerateIndirectObjects();
      
      let imageCount = 0;
      let optimizedCount = 0;

      for (const [ref, obj] of indirectObjects) {
        if (!(obj instanceof PDFRawStream)) continue;

        const dict = obj.dict;
        const subtype = dict.get(PDFName.of("Subtype"));
        if (subtype?.toString() !== "/Image") continue;

        imageCount++;
        try {
          const rawData = obj.getContents();
          if (!rawData || rawData.length < 100) continue;

          let sharpInstance = sharp(rawData, { failOn: "none" });

          // EXTREME downsampling
          if (preset === "max") {
            const metadata = await sharpInstance.metadata();
            if (metadata.width && metadata.width > 1000) {
              sharpInstance = sharpInstance.resize({ width: 800, withoutEnlargement: true });
            }
          }

          const optimized = await sharpInstance
            .jpeg({ quality, mozjpeg: true, progressive: true })
            .toBuffer();

          // Force replacement in MAX mode if it's smaller, otherwise check savings
          const threshold = preset === "max" ? 1.0 : 0.95;
          if (optimized.length < rawData.length * threshold) {
            const newDict = dict.clone();
            newDict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
            newDict.set(PDFName.of("Length"), pdfDoc.context.obj(optimized.length));

            const newStream = PDFRawStream.of(newDict, new Uint8Array(optimized));
            pdfDoc.context.assign(ref, newStream);
            optimizedCount++;
          }
        } catch (e) {
          // Skip incompatible objects
        }
      }
      console.log(`[PDF-ENGINE] Found: ${imageCount}, Optimized: ${optimizedCount}`);
    }

    // FINAL SAVE: Structural Optimization
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const savings = (((originalSize - compressedBytes.length) / originalSize) * 100).toFixed(1);

    console.log(`[PDF-ENGINE] Result: ${originalSize} B -> ${compressedBytes.length} B (Saved ${savings}% in ${duration}s)\n`);

    return new NextResponse(Buffer.from(compressedBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compressed_${file.name}"`,
      },
    });

  } catch (err: any) {
    console.error("[PDF-ENGINE] FATAL ERROR:", err.message);
    return NextResponse.json({ error: "Compression failed", details: err.message }, { status: 500 });
  }
}
