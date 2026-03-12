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
  FilePlus,
  Maximize,
  Sparkles,
  Zap,
  Image as ImageIcon,
  Save,
} from "lucide-react";
import { cn, formatSize } from "@/lib/utils";
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
import { Slider } from "@/components/ui/slider";
import { IMAGE_UPSCALE_CONTENT } from "@/data/tools/image-tools/upscale";

export default function ImageUpscale() {
  const { title, description, about, features, steps } = IMAGE_UPSCALE_CONTENT;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scale, setScale] = useState<number>(2);

  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"png" | "jpeg" | "webp">("png");

  const history = useLiveQuery(() =>
    db.history.where("toolUrl").equals("/upscale-image").reverse().toArray()
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }

    setFile(selectedFile);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpscale = async () => {
    if (!preview) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = preview;
      await new Promise((resolve) => (img.onload = resolve));

      // Canvas limits: Most browsers cap at ~16k-32k pixels. 
      // We check if the target size is reasonable.
      if (img.width * scale > 16384 || img.height * scale > 16384) {
        toast.error("Target resolution too high for your browser. Try a lower scale.");
        setIsProcessing(false);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // For higher scales, we use a step-down/up approach for better interpolation
      if (scale > 2) {
        const steps = Math.ceil(Math.log2(scale));
        let currentCanvas = document.createElement("canvas");
        currentCanvas.width = img.width;
        currentCanvas.height = img.height;
        const currentCtx = currentCanvas.getContext("2d")!;
        currentCtx.drawImage(img, 0, 0);

        for (let i = 1; i <= steps; i++) {
          const targetScale = Math.min(Math.pow(2, i), scale);
          const nextCanvas = document.createElement("canvas");
          nextCanvas.width = img.width * targetScale;
          nextCanvas.height = img.height * targetScale;
          const nextCtx = nextCanvas.getContext("2d")!;
          nextCtx.imageSmoothingEnabled = true;
          nextCtx.imageSmoothingQuality = "high";
          nextCtx.drawImage(currentCanvas, 0, 0, nextCanvas.width, nextCanvas.height);
          currentCanvas = nextCanvas;
        }
        ctx.drawImage(currentCanvas, 0, 0);
      } else {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );

      if (blob) {
        const url = URL.createObjectURL(blob);
        setResult({ url, blob });
        toast.success(`Image upscaled to ${scale}x!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upscale image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!result || !file) {
      toast.error("No result to save");
      return;
    }

    try {
      await db.history.add({
        toolUrl: "/upscale-image",
        toolName: "Image Upscale",
        input: { fileName: file.name, scale: `${scale}x` },
        result: { size: result.blob.size },
        file: { 
          blob: result.blob, 
          name: `upscaled_${scale}x_${file.name}` 
        },
        timestamp: Date.now(),
      });
      toast.success("Saved to history");
    } catch (err) {
      toast.error("Failed to save");
    }
  };

  const handleDownloadClick = (premadeBlob?: Blob) => {
    if (premadeBlob) {
      setResult({ url: URL.createObjectURL(premadeBlob), blob: premadeBlob });
      setIsFormatDialogOpen(true);
    } else if (result?.blob) {
      setIsFormatDialogOpen(true);
    } else {
      toast.error("No image to download");
    }
  };

  const executeDownload = async () => {
    if (!result) return;
    setIsFormatDialogOpen(false);

    try {
      const img = new Image();
      img.src = result.url;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Context failed");

      ctx.drawImage(img, 0, 0);

      const mime = selectedFormat === "jpeg" ? "image/jpeg" : selectedFormat === "webp" ? "image/webp" : "image/png";
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), mime, 0.92)
      );

      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `upscaled_${scale}x_${Date.now()}.${selectedFormat === "jpeg" ? "jpg" : selectedFormat}`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success("Download started!");
      }
    } catch (err) {
      toast.error("Download failed");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="max-w-5xl mr-auto animate-fade-in pb-10">
      <div className="mb-6">
        <h1 className="text-xl sm:text-3xl font-extrabold font-display">
          {title.split(" ")[0]}{" "}
          <span className="text-primary">{title.split(" ").slice(1).join(" ")}</span>
        </h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-2 border-dashed transition-colors hover:border-primary/30">
            <CardContent className="pt-10 pb-10">
              {!preview ? (
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
                    <p className="text-lg font-semibold">Select Image to Upscale</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Enlarge images up to 8x their size using local AI enhancement
                    </p>
                    <Button
                      className="mt-6 font-semibold"
                      onClick={() =>
                        (document.getElementById("upload") as HTMLInputElement)?.click()
                      }
                    >
                      Choose File
                    </Button>
                  </Label>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Original</Label>
                      <div className="aspect-square rounded border bg-muted/30 overflow-hidden flex items-center justify-center relative">
                        <img src={preview} alt="Original" className="max-w-full max-h-full object-contain" />
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                          {file?.name}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview Result</Label>
                      <div className="aspect-square rounded border bg-muted/30 overflow-hidden flex items-center justify-center relative border-primary/20">
                        {result?.url ? (
                          <img src={result.url} alt="Upscaled" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Sparkles className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-xs">Select scale and click Upscale</p>
                          </div>
                        )}
                        {isProcessing && (
                          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center animate-pulse">
                            <Zap className="h-8 w-8 text-primary animate-bounce" />
                            <p className="text-sm font-bold mt-2">Processing...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-6 rounded border border-primary/10">
                    <div className="flex items-center justify-between ">
                      <Label className="text-sm text-muted-foreground font-bold uppercase">Upscale Factor</Label>
                      <span className="text-lg font-black text-primary bg-primary/10 px-3 py-1 rounded-md">
                        {scale}X
                      </span>
                    </div>
                    <Slider
                      value={[scale]}
                      min={1}
                      max={8}
                      step={0.5}
                      onValueChange={([v]) => setScale(v)}
                      className="py-4"
                    />
                    <p className="text-[10px] text-muted-foreground uppercase font-normal tracking-widest mt-2 w-full text-right">
                      {scale === 1 ? "Original Size" : scale <= 2 ? "High Quality" : scale <= 4 ? "Standard" : "Maximum (May be blurry)"}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="outline" className="flex-1 h-10 font-semibold uppercase tracking-widest" onClick={reset}>
                      <FilePlus className="mr-2 h-4 w-4" /> New Image
                    </Button>
                    {!result ? (
                      <Button className="flex-1 h-10 uppercase font-semibold tracking-widest " onClick={handleUpscale} disabled={isProcessing}>
                        <Maximize className="mr-2 h-4 w-4" /> Upscale Now
                      </Button>
                    ) : (
                      <>
                        <Button className="flex-1 h-10 uppercase font-semibold tracking-widest " onClick={() => handleDownloadClick()}>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                        <Button variant="secondary" className="h-10 uppercase tracking-widest  px-8" onClick={handleSaveToHistory}>
                          <Save className="mr-2 h-4 w-4" /> Save
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
                  onClick={async () => {
                    await db.history.where("toolUrl").equals("/upscale-image").delete();
                    toast.success("History cleared");
                  }}
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
                          <ImageIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="grid gap-1">
                          <p className="font-medium text-sm break-all line-clamp-1">{item.input?.fileName}</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                              {item.input?.scale} SCALE
                            </span>
                            <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-semibold uppercase">
                              {formatSize(item.result?.size || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleDownloadClick(item.file?.blob)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                          onClick={async () => await db.history.delete(item.id)}
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
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-center">Upscaling Intel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: "Resolution", desc: "High upscaling can significantly increase file size and memory usage.", color: "text-amber-500" },
                { title: "Quality", desc: "Using values between 2x and 4x often provides the best balance of detail.", color: "text-green-500" },
                { title: "Local", desc: "No data is sent to servers. Everything stays private in your browser.", color: "text-blue-500" },
              ].map((tip, i) => (
                <div key={i} className="space-y-1.5 p-3 rounded bg-muted/50 border border-transparent hover:border-primary/20 transition-colors">
                  <p className={cn("text-xs font-bold uppercase tracking-widest", tip.color)}>{tip.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
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
              Choose your preferred format for the high-res image.
            </p>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-6">
            <div className="grid grid-cols-3 gap-3 w-full">
              {[
                { id: "png", label: "PNG", desc: "High Quality" },
                { id: "jpeg", label: "JPG", desc: "Standard" },
                { id: "webp", label: "WebP", desc: "Optimized" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id as "png" | "jpeg" | "webp")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded border-2 transition-all group",
                    selectedFormat === fmt.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30 bg-muted/30"
                  )}
                >
                  <span className={cn("text-sm font-bold", selectedFormat === fmt.id ? "text-primary" : "text-foreground")}>
                    {fmt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{fmt.desc}</span>
                  {selectedFormat === fmt.id && <div className="h-1 w-1 bg-primary rounded-full mt-1" />}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="sm:justify-between gap-3">
            <Button variant="outline" className="rounded" onClick={() => setIsFormatDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={executeDownload} className="flex-2 font-bold rounded">
              Download {selectedFormat.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolInfo({ about, features, steps }: { about: string[]; features: any[]; steps: any[] }) {
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
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">
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
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
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
                <span className="text-xl font-black text-muted-foreground/80 leading-none">{s.step}</span>
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
