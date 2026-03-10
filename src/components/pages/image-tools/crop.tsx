"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Download,
  Upload,
  History,
  Trash2,
  Info,
  Star,
  ListChecks,
  Loader2,
  FilePlus,
  Crop as CropIcon,
  RotateCcw,
  Maximize2,
  Square,
  RectangleHorizontal,
  Move,
} from "lucide-react";
import { cn, formatSize } from "@/lib/utils";
import { CROP_IMAGE_CONTENT } from "@/data/tools/image-tools/crop";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import PerspT from "perspective-transform";

type Point = { x: number; y: number };
type CropRect = { x: number; y: number; width: number; height: number };
type AspectRatio = "free" | "1:1" | "4:3" | "16:9" | "perspective";

export default function CropImage() {
  const { title, description, about, features, steps } = CROP_IMAGE_CONTENT;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
  const [crop, setCrop] = useState<CropRect>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  const [corners, setCorners] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 90, y: 10 },
    { x: 90, y: 90 },
    { x: 10, y: 90 },
  ]);
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(
    null,
  );
  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"jpeg" | "png" | "webp">(
    "jpeg",
  );
  const [activeBlob, setActiveBlob] = useState<Blob | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const history = useLiveQuery(() =>
    db.history.where("toolUrl").equals("/crop-image").reverse().toArray(),
  );

  useEffect(() => {
    if (aspectRatio === "1:1") updateCropForRatio(1);
    else if (aspectRatio === "4:3") updateCropForRatio(4 / 3);
    else if (aspectRatio === "16:9") updateCropForRatio(16 / 9);
    else if (aspectRatio === "perspective") {
      // Sync corners with current crop rect if switching to perspective
      setCorners([
        { x: crop.x, y: crop.y },
        { x: crop.x + crop.width, y: crop.y },
        { x: crop.x + crop.width, y: crop.y + crop.height },
        { x: crop.x, y: crop.y + crop.height },
      ]);
    }
  }, [aspectRatio]);

  const updateCropForRatio = (ratio: number) => {
    setCrop((prev) => {
      let newWidth = prev.width;
      let newHeight = newWidth / ratio;
      if (newHeight > 100 - prev.y) {
        newHeight = 100 - prev.y;
        newWidth = newHeight * ratio;
      }
      if (newWidth > 100 - prev.x) {
        newWidth = 100 - prev.x;
        newHeight = newWidth / ratio;
      }
      return { ...prev, width: newWidth, height: newHeight };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setResult(null);
      const reader = new FileReader();
      reader.onload = (event) => setPreview(event.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile) {
      toast.error("Please upload a valid image file.");
    }
  };

  const handlePointDrag = (
    index: number,
    e: React.MouseEvent | React.TouchEvent,
  ) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientX
          : moveEvent.clientX;
      const clientY =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientY
          : moveEvent.clientY;

      const x = Math.max(
        0,
        Math.min(100, ((clientX - rect.left) / rect.width) * 100),
      );
      const y = Math.max(
        0,
        Math.min(100, ((clientY - rect.top) / rect.height) * 100),
      );

      setCorners((prev) => prev.map((p, i) => (i === index ? { x, y } : p)));
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  };

  const handleDrag = (
    e: React.MouseEvent | React.TouchEvent,
    type: "move" | "resize",
  ) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const startY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const startCrop = { ...crop };

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientX
          : moveEvent.clientX;
      const currentY =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientY
          : moveEvent.clientY;
      const deltaX = ((currentX - startX) / rect.width) * 100;
      const deltaY = ((currentY - startY) / rect.height) * 100;

      setCrop((prev) => {
        if (type === "move") {
          return {
            ...prev,
            x: Math.max(0, Math.min(100 - prev.width, startCrop.x + deltaX)),
            y: Math.max(0, Math.min(100 - prev.height, startCrop.y + deltaY)),
          };
        } else {
          let newWidth = Math.max(
            5,
            Math.min(100 - prev.x, startCrop.width + deltaX),
          );
          let newHeight = Math.max(
            5,
            Math.min(100 - prev.y, startCrop.height + deltaY),
          );

          if (aspectRatio !== "free" && aspectRatio !== "perspective") {
            const ratio =
              aspectRatio === "1:1"
                ? 1
                : aspectRatio === "4:3"
                  ? 4 / 3
                  : 16 / 9;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              newHeight = newWidth / ratio;
              if (newHeight + prev.y > 100) {
                newHeight = 100 - prev.y;
                newWidth = newHeight * ratio;
              }
            } else {
              newWidth = newHeight * ratio;
              if (newWidth + prev.x > 100) {
                newWidth = 100 - prev.x;
                newHeight = newWidth / ratio;
              }
            }
          }
          return { ...prev, width: newWidth, height: newHeight };
        }
      });
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  };

  const applyCrop = async () => {
    if (!preview || !imgRef.current) return;
    setIsProcessing(true);

    try {
      const img = imgRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      if (aspectRatio === "perspective") {
        // Perspective Transformation logic
        const outWidth = 1200;
        const outHeight = 1600;
        canvas.width = outWidth;
        canvas.height = outHeight;

        const srcPoints = corners.flatMap((p) => [
          (p.x / 100) * img.naturalWidth,
          (p.y / 100) * img.naturalHeight,
        ]);
        const dstPoints = [
          0,
          0,
          outWidth,
          0,
          outWidth,
          outHeight,
          0,
          outHeight,
        ];
        const invPerspT = PerspT(dstPoints, srcPoints);

        const imgData = ctx.createImageData(outWidth, outHeight);
        const srcCanvas = document.createElement("canvas");
        srcCanvas.width = img.naturalWidth;
        srcCanvas.height = img.naturalHeight;
        const srcCtx = srcCanvas.getContext("2d")!;
        srcCtx.drawImage(img, 0, 0);
        const srcData = srcCtx.getImageData(
          0,
          0,
          img.naturalWidth,
          img.naturalHeight,
        );

        for (let y = 0; y < outHeight; y++) {
          for (let x = 0; x < outWidth; x++) {
            const [srcX, srcY] = invPerspT.transform(x, y);
            if (
              srcX >= 0 &&
              srcX < img.naturalWidth &&
              srcY >= 0 &&
              srcY < img.naturalHeight
            ) {
              const srcIdx =
                (Math.floor(srcY) * img.naturalWidth + Math.floor(srcX)) * 4;
              const dstIdx = (y * outWidth + x) * 4;
              imgData.data[dstIdx] = srcData.data[srcIdx];
              imgData.data[dstIdx + 1] = srcData.data[srcIdx + 1];
              imgData.data[dstIdx + 2] = srcData.data[srcIdx + 2];
              imgData.data[dstIdx + 3] = srcData.data[srcIdx + 3];
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } else {
        // Normal Rectangular Crop logic
        const scaleX = img.naturalWidth / 100;
        const scaleY = img.naturalHeight / 100;

        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;

        ctx.drawImage(
          img,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }

      canvas.toBlob(
        async (blob) => {
          if (!blob) throw new Error("Crop failed");
          const url = URL.createObjectURL(blob);
          setResult({ url, blob });
          setIsProcessing(false);
          await saveToHistory(blob);
          toast.success("Image cropped successfully!");
        },
        file?.type || "image/jpeg",
        0.9,
      );
    } catch (e) {
      toast.error("Failed to crop image.");
      setIsProcessing(false);
    }
  };

  const handleDownloadClick = (blob?: Blob) => {
    setActiveBlob(blob || result?.blob || null);
    setIsFormatDialogOpen(true);
  };

  const executeDownload = async () => {
    const blobToProcess = activeBlob || result?.blob;
    if (!blobToProcess) return;
    setIsFormatDialogOpen(false);

    try {
      const url = URL.createObjectURL(blobToProcess);
      const img = new Image();
      img.src = url;
      await new Promise((r) => (img.onload = r));

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `cropped_${Date.now()}.${selectedFormat === "jpeg" ? "jpg" : selectedFormat}`;
          link.click();
          URL.revokeObjectURL(downloadUrl);
          URL.revokeObjectURL(url);
        },
        `image/${selectedFormat}`,
        selectedFormat === "png" ? undefined : 0.9,
      );
    } catch (e) {
      toast.error("Download failed");
    }
    setActiveBlob(null);
  };

  const saveToHistory = async (blob: Blob) => {
    await db.history.add({
      toolUrl: "/crop-image",
      toolName: "Crop Image",
      input: { timestamp: Date.now() },
      result: { size: blob.size },
      file: {
        blob: blob,
        name: `cropped_${Date.now()}.jpg`,
      },
      timestamp: Date.now(),
    });
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/crop-image").delete();
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreview(null);
    setResult(null);
    setAspectRatio("free");
    setCrop({ x: 10, y: 10, width: 80, height: 80 });
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
              file ? "border-primary bg-primary/5" : "hover:border-primary/30",
            )}
          >
            <CardContent className="pt-10 pb-10">
              {!file ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <input
                    type="file"
                    id="upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <Label htmlFor="upload" className="cursor-pointer">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-bold">Select Image to Crop</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Upload an image to start cropping. All processing is 100%
                      local.
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
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-2 justify-start">
                        {(
                          ["free", "1:1", "4:3", "16:9", "perspective"] as const
                        ).map((r) => (
                          <Button
                            key={r}
                            variant={aspectRatio === r ? "default" : "outline"}
                            size="sm"
                            className="rounded px-4 h-8 text-xs font-bold"
                            onClick={() => setAspectRatio(r)}
                          >
                            {r === "1:1" && <Square className="mr-2 h-3 w-3" />}
                            {r !== "1:1" && r !== "free" && (
                              <RectangleHorizontal className="mr-2 h-3 w-3" />
                            )}
                            {r === "free" && (
                              <Maximize2 className="mr-2 h-3 w-3" />
                            )}
                            {r.toUpperCase()}
                          </Button>
                        ))}
                      </div>

                      <div
                        ref={containerRef}
                        className="relative w-full aspect-square sm:aspect-4/3 bg-black rounded-lg overflow-hidden flex items-center justify-center cursor-crosshair touch-none select-none"
                      >
                        <img
                          ref={imgRef}
                          src={preview!}
                          alt="To crop"
                          className="max-w-full max-h-full object-contain pointer-events-none"
                        />

                        {/* Backdrop shadows */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div
                            className="absolute bg-transparent border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-10 pointer-events-auto"
                            style={{
                              left: `${crop.x}%`,
                              top: `${crop.y}%`,
                              width: `${crop.width}%`,
                              height: `${crop.height}%`,
                            }}
                          >
                            {/* Crop Grid */}
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none">
                              <div className="border-r border-b border-white"></div>
                              <div className="border-r border-b border-white"></div>
                              <div className="border-b border-white"></div>
                              <div className="border-r border-b border-white"></div>
                              <div className="border-r border-b border-white"></div>
                              <div className="border-b border-white"></div>
                              <div className="border-r border-white"></div>
                              <div className="border-r border-white"></div>
                              <div></div>
                            </div>

                            {/* Move Handle */}
                            <div
                              className="absolute inset-0 cursor-move flex items-center justify-center group pointer-events-auto"
                              onMouseDown={(e) => handleDrag(e, "move")}
                              onTouchStart={(e) => handleDrag(e, "move")}
                            >
                              <Move className="h-6 w-6 text-white/50 group-active:text-white transition-colors opacity-0 group-hover:opacity-100" />
                            </div>

                            {/* Resize Handle (Bottom Right) */}
                            <div
                              className="absolute bottom-0 right-0 h-10 w-10 cursor-nwse-resize flex items-center justify-center pointer-events-auto z-20"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleDrag(e, "resize");
                              }}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                                handleDrag(e, "resize");
                              }}
                            >
                              <div className="h-4 w-4 bg-white border-2 border-primary rounded-full shadow-lg" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center italic">
                        Drag the center to move, or the bottom-right corner to
                        resize.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative w-full aspect-4/3 max-w-md mx-auto bg-white rounded shadow-2xl overflow-hidden flex items-center justify-center border-8 border-muted">
                        <img
                          src={result.url}
                          alt="Cropped result"
                          className="max-w-full max-h-full object-contain"
                        />
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
                          onClick={applyCrop}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CropIcon className="mr-2 h-4 w-4" />
                          )}
                          {isProcessing ? "Cropping..." : "Apply Crop"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={reset}
                        >
                          <FilePlus className="mr-2 h-4 w-4" /> New Crop
                        </Button>
                        <Button
                          className="flex-2 font-bold"
                          onClick={() => handleDownloadClick()}
                        >
                          <Download className="mr-2 h-4 w-4" /> Download Cropped
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
                        <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                          <CropIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Image Cropped</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                            <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded">
                              {formatSize(item.result?.size || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.file?.blob && (
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            title="Download"
                            onClick={() => handleDownloadClick(item.file!.blob)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
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
                <CropIcon className="h-6 w-6" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-center">
                Cropping Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  title: "Rule of Thirds",
                  desc: "Use the grid lines to place key elements at intersections for a better composition.",
                  color: "text-amber-500",
                },
                {
                  title: "Presets",
                  desc: "Use 1:1 for profile pictures and 16:9 for cinematic desktop wallpapers.",
                  color: "text-blue-500",
                },
                {
                  title: "Quality",
                  desc: "Always start with the highest resolution image for the sharpest crop.",
                  color: "text-green-500",
                },
              ].map((tip, i) => (
                <div
                  key={i}
                  className="space-y-1.5 p-3 rounded-lg bg-muted/50 border border-transparent hover:border-primary/20 transition-colors"
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
              Download Format
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-left">
              Choose your preferred image format for export.
            </p>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-6">
            <div className="grid grid-cols-3 gap-3 w-full">
              {(
                [
                  { id: "jpeg", label: "JPG", desc: "Standard" },
                  { id: "png", label: "PNG", desc: "Lossless" },
                  { id: "webp", label: "WebP", desc: "Optimized" },
                ] as const
              ).map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all group",
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
            <Button onClick={executeDownload} className="flex-2 font-bold">
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
