"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Scan,
  RotateCcw,
  Download,
  Upload,
  Image as ImageIcon,
  History,
  Trash2,
  Info,
  Star,
  ListChecks,
  FileType,
  Maximize2,
  Loader2,
  FilePlus,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { cn, formatSize } from "@/lib/utils";
import { SCANNER_CONTENT } from "@/data/tools/image-tools/scanner";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import PerspT from "perspective-transform";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Point = { x: number; y: number };

export default function ImageScanner() {
  const { title, description, about, features, steps } = SCANNER_CONTENT;
  const [image, setImage] = useState<string | null>(null);
  const [corners, setCorners] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 90, y: 10 },
    { x: 90, y: 90 },
    { x: 10, y: 90 },
  ]);
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<"none" | "bw" | "vibrant">("none");
  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"jpeg" | "png" | "webp">(
    "jpeg",
  );
  const [activeBlob, setActiveBlob] = useState<Blob | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const history = useLiveQuery(() =>
    db.history.where("toolUrl").equals("/image-scanner").reverse().toArray(),
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResult(null);
        setFilter("none");
        setCorners([
          { x: 10, y: 10 },
          { x: 90, y: 10 },
          { x: 90, y: 90 },
          { x: 10, y: 90 },
        ]);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast.error("Please upload a valid image file.");
    }
  };

  const applyScan = async () => {
    if (!image || !imgRef.current) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = image;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const outWidth = 1200;
      const outHeight = 1600;
      canvas.width = outWidth;
      canvas.height = outHeight;

      const srcPoints = corners.flatMap((p) => [
        (p.x / 100) * img.width,
        (p.y / 100) * img.height,
      ]);

      const dstPoints = [0, 0, outWidth, 0, outWidth, outHeight, 0, outHeight];
      const invPerspT = PerspT(dstPoints, srcPoints);

      const imgData = ctx.createImageData(outWidth, outHeight);
      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = img.width;
      srcCanvas.height = img.height;
      const srcCtx = srcCanvas.getContext("2d")!;
      srcCtx.drawImage(img, 0, 0);
      const srcData = srcCtx.getImageData(0, 0, img.width, img.height);

      for (let y = 0; y < outHeight; y++) {
        for (let x = 0; x < outWidth; x++) {
          const [srcX, srcY] = invPerspT.transform(x, y);
          if (srcX >= 0 && srcX < img.width && srcY >= 0 && srcY < img.height) {
            const srcIdx =
              (Math.floor(srcY) * img.width + Math.floor(srcX)) * 4;
            const dstIdx = (y * outWidth + x) * 4;
            imgData.data[dstIdx] = srcData.data[srcIdx];
            imgData.data[dstIdx + 1] = srcData.data[srcIdx + 1];
            imgData.data[dstIdx + 2] = srcData.data[srcIdx + 2];
            imgData.data[dstIdx + 3] = srcData.data[srcIdx + 3];
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob(
        async (blob) => {
          if (!blob) throw new Error("Scan failed");
          const url = URL.createObjectURL(blob);
          setResult({ url, blob });
          setIsProcessing(false);
          await saveToHistory(blob);
          toast.success("Document scanned successfully!");
        },
        "image/jpeg",
        0.9,
      );
    } catch (e) {
      toast.error("Failed to apply scan.");
      setIsProcessing(false);
    }
  };

  const handleDownloadImageClick = (blob?: Blob) => {
    setActiveBlob(blob || result?.blob || null);
    setIsFormatDialogOpen(true);
  };

  const executeDownload = async () => {
    const blobToProcess = activeBlob || result?.blob;
    if (!blobToProcess) return;
    setIsFormatDialogOpen(false);

    let blobToDownload = blobToProcess;
    // Apply filter only if it's the current result being downloaded (activeBlob is null or same reference as result.blob)
    const isCurrentResult = !activeBlob || activeBlob === result?.blob;

    if ((isCurrentResult && filter !== "none") || selectedFormat !== "jpeg") {
      blobToDownload = await applyFilterAndFormatToBlob(
        blobToProcess,
        isCurrentResult ? filter : "none",
        selectedFormat,
      );
    }

    const url = URL.createObjectURL(blobToDownload);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scan_${Date.now()}.${selectedFormat === "jpeg" ? "jpg" : selectedFormat}`;
    link.click();
    URL.revokeObjectURL(url);
    setActiveBlob(null);
  };

  const downloadPDF = async (customBlob?: Blob) => {
    const blobToProcessOrigin = customBlob || result?.blob;
    if (!blobToProcessOrigin) return;

    let blobToProcess = blobToProcessOrigin;
    const isCurrentResult = !customBlob;

    if (isCurrentResult && filter !== "none") {
      blobToProcess = await applyFilterAndFormatToBlob(
        blobToProcessOrigin,
        filter,
        "jpeg",
      );
    }

    const pdfDoc = await PDFDocument.create();
    const imageBytes = await blobToProcess.arrayBuffer();
    const pdfImage = await pdfDoc.embedJpg(imageBytes);

    const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
    page.drawImage(pdfImage, {
      x: 0,
      y: 0,
      width: pdfImage.width,
      height: pdfImage.height,
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes as any], { type: "application/pdf" });
    const url = URL.createObjectURL(pdfBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `scan_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyFilterAndFormatToBlob = (
    blob: Blob,
    filterType: string,
    format: string,
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = img.width;
        canvas.height = img.height;

        if (filterType === "bw") {
          ctx.filter = "grayscale(100%) contrast(2) brightness(1.1)";
        } else if (filterType === "vibrant") {
          ctx.filter = "contrast(1.3) saturate(1.2) brightness(1.05)";
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob((b) => resolve(b || blob), `image/${format}`, 0.9);
      };
      img.src = url;
    });
  };

  const saveToHistory = async (blob: Blob) => {
    await db.history.add({
      toolUrl: "/image-scanner",
      toolName: "Image Scanner",
      input: { timestamp: Date.now() },
      result: { status: "completed", size: blob.size },
      file: {
        blob: blob,
        name: `scan_${Date.now()}.jpg`,
      },
      timestamp: Date.now(),
    });
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/image-scanner").delete();
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const downloadImageFromHistory = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scan_history_${Date.now()}.jpg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url);
    setImage(null);
    setResult(null);
    setFilter("none");
    setCorners([
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 },
    ]);
  };

  return (
    <div className="max-w-5xl mr-auto animate-fade-in pb-10">
      <div className="mb-6">
        <h1 className="text-xl sm:text-3xl font-extrabold font-display">
          {title.split(" ")[0]}{" "}
          <span className="text-primary">
            {title.split(" ").slice(1).join(" ")}
          </span>
        </h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card
            className={cn(
              "border-2 border-dashed transition-colors",
              image ? "border-primary bg-primary/5" : "hover:border-primary/30",
            )}
          >
            <CardContent className="pt-10 pb-10">
              {!image ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <input
                    type="file"
                    id="upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Label htmlFor="upload" className="cursor-pointer">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-bold">Upload Document Image</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Take a photo of your document and upload it here to start
                      scanning.
                    </p>
                    <Button
                      className="mt-6 font-semibold"
                      onClick={() =>
                        (
                          document.getElementById("upload") as HTMLInputElement
                        )?.click()
                      }
                    >
                      Choose File
                    </Button>
                  </Label>
                </div>
              ) : (
                <div className="space-y-6">
                  {!result ? (
                    <div className="relative group max-w-2xl mx-auto">
                      <div
                        ref={containerRef}
                        className="relative w-full aspect-square sm:aspect-4/3 bg-black rounded overflow-hidden flex items-center justify-center cursor-crosshair touch-none select-none"
                      >
                        <img
                          ref={imgRef}
                          src={image}
                          alt="To scan"
                          className="max-w-full max-h-full object-contain pointer-events-none"
                        />
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                          <line
                            x1={`${corners[0].x}%`}
                            y1={`${corners[0].y}%`}
                            x2={`${corners[1].x}%`}
                            y2={`${corners[1].y}%`}
                            stroke="white"
                            strokeWidth="2"
                            strokeDasharray="4"
                          />
                          <line
                            x1={`${corners[1].x}%`}
                            y1={`${corners[1].y}%`}
                            x2={`${corners[2].x}%`}
                            y2={`${corners[2].y}%`}
                            stroke="white"
                            strokeWidth="2"
                            strokeDasharray="4"
                          />
                          <line
                            x1={`${corners[2].x}%`}
                            y1={`${corners[2].y}%`}
                            x2={`${corners[3].x}%`}
                            y2={`${corners[3].y}%`}
                            stroke="white"
                            strokeWidth="2"
                            strokeDasharray="4"
                          />
                          <line
                            x1={`${corners[3].x}%`}
                            y1={`${corners[3].y}%`}
                            x2={`${corners[0].x}%`}
                            y2={`${corners[0].y}%`}
                            stroke="white"
                            strokeWidth="2"
                            strokeDasharray="4"
                          />
                        </svg>
                        {corners.map((p, i) => (
                          <div
                            key={i}
                            className="absolute h-8 w-8 bg-primary border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2 cursor-move shadow-2xl flex items-center justify-center active:scale-125 transition-transform z-20"
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            onMouseDown={(e) => {
                              const rect =
                                containerRef.current!.getBoundingClientRect();
                              const onMouseMove = (moveEvent: MouseEvent) => {
                                const x =
                                  ((moveEvent.clientX - rect.left) /
                                    rect.width) *
                                  100;
                                const y =
                                  ((moveEvent.clientY - rect.top) /
                                    rect.height) *
                                  100;
                                setCorners((prev) =>
                                  prev.map((point, idx) =>
                                    idx === i
                                      ? {
                                          x: Math.max(0, Math.min(100, x)),
                                          y: Math.max(0, Math.min(100, y)),
                                        }
                                      : point,
                                  ),
                                );
                              };
                              const onMouseUp = () => {
                                document.removeEventListener(
                                  "mousemove",
                                  onMouseMove,
                                );
                                document.removeEventListener(
                                  "mouseup",
                                  onMouseUp,
                                );
                              };
                              document.addEventListener(
                                "mousemove",
                                onMouseMove,
                              );
                              document.addEventListener("mouseup", onMouseUp);
                            }}
                          >
                            <div className="h-1 w-1 bg-white rounded-full" />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-2 justify-center text-xs text-muted-foreground font-medium  py-2">
                        <Maximize2 className="h-3 w-3" />
                        Drag corners to align with document edges
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative w-full aspect-4/3 max-w-full mx-auto bg-black rounded shadow-sm overflow-hidden flex items-center justify-center border-8 border-muted">
                        <img
                          src={result.url}
                          alt="Scanned result"
                          className={cn(
                            "w-full h-full object-contain transition-all duration-300",
                            filter === "bw" &&
                              "grayscale contrast-[2] brightness-[1.1]",
                            filter === "vibrant" &&
                              "contrast-[1.3] saturate-[1.2] brightness-[1.05]",
                          )}
                        />
                      </div>

                      <div className="flex flex-col items-center gap-4">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Enhance Scan
                        </Label>
                        <div className="flex items-center w-full justify-center flex-wrap gap-2 p-1 bg-muted rounded">
                          {[
                            { id: "none", label: "Original", icon: ImageIcon },
                            { id: "bw", label: "B&W", icon: Scan },
                            { id: "vibrant", label: "Vibrant", icon: Zap },
                          ].map((f) => (
                            <Button
                              key={f.id}
                              variant={filter === f.id ? "outline" : "ghost"}
                              size="sm"
                              className={`rounded h-8 border  px-4 font-semibold text-xs
                                     ${filter !== f.id ? " bg-background " :"border-accent text-accent"}
                                      `}
                              onClick={() => setFilter(f.id as any)}
                            >
                              <f.icon className="mr-2 h-3 w-3" />
                              {f.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    {!result ? (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={reset}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" /> Reset
                        </Button>
                        <Button
                          className="flex-2 font-bold"
                          onClick={applyScan}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Scan className="mr-2 h-4 w-4" />
                          )}
                          {isProcessing ? "Processing..." : "Perform Scan"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={reset}
                        >
                          <FilePlus className="mr-2 h-4 w-4" /> New Scan
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => handleDownloadImageClick(result.blob)}
                        >
                          <Download className="mr-2 h-4 w-4" /> Save Image
                        </Button>
                        <Button
                          className="flex-1"
                          variant="secondary"
                          onClick={() => downloadPDF()}
                        >
                          <FileType className="mr-2 h-4 w-4" /> Save PDF
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {history && history.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  History
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={clearAllHistory}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Clear All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap gap-4 items-center justify-between p-4 bg-muted/30 rounded border group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-sm line-clamp-1 break-all">{item.file?.name || "Document Scanned"}</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                            <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 font-semibold rounded">
                              {formatSize(item.result?.size || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.file?.blob && (
                          <>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              title="Download Image"
                              onClick={() =>
                                handleDownloadImageClick(item.file!.blob)
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              title="Download PDF"
                              onClick={() => downloadPDF(item.file!.blob)}
                            >
                              <FileType className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete"
                          onClick={() => deleteHistoryItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            <ToolInfo about={about} features={features} steps={steps} />
          </div>
        </div>

        <div className="hidden xl:block space-y-6 h-fit">
          <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden">
            <div className="p-1 bg-primary/5 border-b flex items-center justify-center py-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Scan className="h-6 w-6" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-center">
                Scan Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  title: "Lighting",
                  desc: "Use bright, indirect light to avoid harsh shadows and glares.",
                  color: "text-amber-500",
                },
                {
                  title: "Contrast",
                  desc: "Dark documents on light background (or vice-versa) scan better.",
                  color: "text-blue-500",
                },
                {
                  title: "Stability",
                  desc: "Hold your camera directly above the document for best results.",
                  color: "text-green-500",
                },
              ].map((tip, i) => (
                <div
                  key={i}
                  className="space-y-1.5 p-3 rounded bg-muted/50 border border-transparent hover:border-primary/20 transition-colors"
                >
                  <p
                    className={cn(
                      "text-xs font-black uppercase tracking-widest",
                      tip.color,
                    )}
                  >
                    {tip.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tip.desc}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isFormatDialogOpen} onOpenChange={setIsFormatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export Format
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-left">
              Choose the preferred image format for your scanned document.
            </p>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-6">
            <div className="grid grid-cols-3 gap-3 w-full">
              {(
                [
                  { id: "jpeg", label: "JPG", desc: "Small file" },
                  { id: "png", label: "PNG", desc: "High quality" },
                  { id: "webp", label: "WebP", desc: "Modern" },
                ] as const
              ).map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded border-2 transition-all group",
                    selectedFormat === fmt.id
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/30 bg-muted/30",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-bold",
                      selectedFormat === fmt.id
                        ? "text-primary"
                        : "text-foreground",
                    )}
                  >
                    {fmt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                    {fmt.desc}
                  </span>
                  {selectedFormat === fmt.id && (
                    <div className="h-1 w-1 bg-primary rounded-full mt-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="sm:justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setIsFormatDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={executeDownload} className="flex-2 font-semibold">
              Download {selectedFormat.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolInfo({
  about,
  features,
  steps,
}: {
  about: string[];
  features: any[];
  steps: any[];
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Background
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {about.map((p, i) => (
            <p
              key={i}
              className="text-sm text-muted-foreground leading-relaxed"
            >
              {p}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Expert Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-5">
            {features.map((f, i) => (
              <li key={i} className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Operational Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-xl font-black text-muted-foreground/80 leading-none">
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
