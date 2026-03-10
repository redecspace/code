"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  X,
  RefreshCw,
} from "lucide-react";
import { cn, formatSize } from "@/lib/utils";
import { ROTATE_IMAGE_CONTENT } from "@/data/tools/image-tools/rotate";
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

export default function RotateImage() {
  const { title, description, about, features, steps } = ROTATE_IMAGE_CONTENT;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    url: string;
    blob: Blob;
    angle: number;
  } | null>(null);
  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"jpeg" | "png" | "webp">(
    "jpeg",
  );
  const [activeBlob, setActiveBlob] = useState<Blob | null>(null);

  const history = useLiveQuery(() =>
    db.history.where("toolUrl").equals("/rotate-image").reverse().toArray(),
  );

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

  const rotateBy = (angle: number) => {
    setRotation((prev) => (prev + angle) % 360);
  };

  const applyTransformation = async () => {
    if (!preview) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = preview;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const angleRad = (rotation * Math.PI) / 180;

      // Calculate new dimensions to fit rotated image
      const width = img.width;
      const height = img.height;
      const newWidth =
        Math.abs(width * Math.cos(angleRad)) +
        Math.abs(height * Math.sin(angleRad));
      const newHeight =
        Math.abs(width * Math.sin(angleRad)) +
        Math.abs(height * Math.cos(angleRad));

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(angleRad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -width / 2, -height / 2);

      canvas.toBlob(
        async (blob) => {
          if (!blob) throw new Error("Processing failed");
          const url = URL.createObjectURL(blob);
          setResult({ url, blob, angle: rotation });
          setIsProcessing(false);
          await saveToHistory(blob, rotation);
          toast.success("Image updated successfully!");
        },
        file?.type || "image/jpeg",
        0.9,
      );
    } catch (e) {
      toast.error("Failed to process image.");
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
      const downloadUrl = URL.createObjectURL(blobToProcess);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `rotated_${Date.now()}.${selectedFormat === "jpeg" ? "jpg" : selectedFormat}`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      toast.error("Download failed");
    }
    setActiveBlob(null);
  };

  const saveToHistory = async (blob: Blob, angle: number) => {
    await db.history.add({
      toolUrl: "/rotate-image",
      toolName: "Rotate Image",
      input: { angle, flipH, flipV },
      result: { size: blob.size },
      file: {
        blob: blob,
        name: `rotated_${angle}deg.jpg`,
      },
      timestamp: Date.now(),
    });
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/rotate-image").delete();
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreview(null);
    setResult(null);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
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
                    <p className="text-lg font-bold">Select Image to Rotate</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Rotate and flip images instantly in your browser.
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
                <div className="space-y-8">
                  {!result ? (
                    <div className="space-y-8">
                      <div className="flex flex-col sm:flex-row gap-8 items-center">
                        <div className="w-full sm:w-1/2 aspect-square rounded bg-black overflow-hidden border relative flex items-center justify-center group">
                          <img
                            src={preview!}
                            alt="Preview"
                            className="max-w-full max-h-full transition-transform duration-300 shadow-2xl"
                            style={{
                              transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                            }}
                          />
                          <button
                            onClick={reset}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="w-full sm:w-1/2 space-y-6">
                          <div className="grid gap-4">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Orientation Control
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs font-bold"
                                onClick={() => rotateBy(-90)}
                              >
                                <RotateCcw className="mr-2 h-3 w-3" /> -90°
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs font-bold"
                                onClick={() => rotateBy(90)}
                              >
                                <RotateCw className="mr-2 h-3 w-3" /> +90°
                              </Button>
                              <Button
                                variant={flipH ? "default" : "outline"}
                                size="sm"
                                className="h-9 text-xs font-bold"
                                onClick={() => setFlipH(!flipH)}
                              >
                                <FlipHorizontal className="mr-2 h-3 w-3" /> Flip
                                H
                              </Button>
                              <Button
                                variant={flipV ? "default" : "outline"}
                                size="sm"
                                className="h-9 text-xs font-bold"
                                onClick={() => setFlipV(!flipV)}
                              >
                                <FlipVertical className="mr-2 h-3 w-3" /> Flip V
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Custom Angle
                              </Label>
                              <span className="text-sm font-semibold text-primary">
                                {rotation}°
                              </span>
                            </div>
                            <Slider
                              value={[rotation]}
                              onValueChange={(v) => setRotation(v[0])}
                              max={359}
                              min={0}
                              step={1}
                              className="py-2"
                            />
                            <div className="flex gap-2">
                              {[0, 90, 180, 270].map((deg) => (
                                <Button
                                  key={deg}
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-7 text-[10px] font-semibold px-2",
                                    rotation === deg && "text-primary",
                                  )}
                                  onClick={() => setRotation(deg)}
                                >
                                  {deg}°
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative w-full aspect-square sm:aspect-4/3 max-w-full  mx-auto bg-black rounded shadow-sm overflow-hidden flex items-center justify-center border-8 border-muted">
                        <img
                          src={result.url}
                          alt="Processed result"
                          className="max-w-full max-h-full object-contain"
                        />
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-[10px] font-semibold backdrop-blur-sm border border-white/20 flex items-center gap-1.5">
                          <RefreshCw className="h-2.5 w-2.5" />
                          {result.angle}° Rotation
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
                          onClick={applyTransformation}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCw className="mr-2 h-4 w-4" />
                          )}
                          {isProcessing ? "Processing..." : "Apply Changes"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={reset}
                        >
                          <FilePlus className="mr-2 h-4 w-4" /> New Image
                        </Button>
                        <Button
                          className="flex-2 font-bold"
                          onClick={() => handleDownloadClick()}
                        >
                          <Download className="mr-2 h-4 w-4" /> Download Image
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
                        <div className="h-10 min-w-10 bg-primary/10 rounded flex items-center justify-center">
                          <RotateCw className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {item.input.angle}° Rotated
                          </p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                            <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-bold">
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
                <RotateCw className="h-6 w-6" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-center">
                Rotation Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  title: "Standard Fix",
                  desc: "Most phone photos taken sideways need a 90° or 270° rotation.",
                  color: "text-amber-500",
                },
                {
                  title: "Mirror Effect",
                  desc: "Flip horizontally to create a mirror view of any portrait or landscape.",
                  color: "text-blue-500",
                },
                {
                  title: "Zero Data",
                  desc: "We don't see your images. Everything is rendered via HTML5 Canvas in RAM.",
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
              Choose your preferred image format for the rotated export.
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
