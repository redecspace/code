"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  RefreshCw,
  X,
  ArrowRightLeft,
  RotateCcw,
} from "lucide-react";
import { cn, formatSize } from "@/lib/utils";
import { CONVERTER_IMAGE_CONTENT } from "@/data/tools/image-tools/converter";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

type SupportedFormat = "jpeg" | "png" | "webp" | "avif";

export default function ImageConverter() {
  const { title, description, about, features, steps } = CONVERTER_IMAGE_CONTENT;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>("png");
  const [quality, setQuality] = useState(90);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; blob: Blob; format: string; size: number } | null>(null);

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/image-converter")
      .reverse()
      .toArray()
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

  const convertImage = async () => {
    if (!preview || !file) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = preview;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      canvas.width = img.width;
      canvas.height = img.height;
      
      // Handle transparency for JPEG (fill with white)
      if (targetFormat === "jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);

      const mimeType = `image/${targetFormat}`;
      const qualityValue = targetFormat === "png" ? undefined : quality / 100;

      canvas.toBlob(
        async (blob) => {
          if (!blob) throw new Error("Conversion failed");
          const url = URL.createObjectURL(blob);
          setResult({
            url,
            blob,
            format: targetFormat.toUpperCase(),
            size: blob.size,
          });
          setIsProcessing(false);
          await saveToHistory(blob, file.name, targetFormat);
          toast.success(`Converted to ${targetFormat.toUpperCase()} successfully!`);
        },
        mimeType,
        qualityValue
      );
    } catch (e) {
      toast.error("Failed to convert image.");
      setIsProcessing(false);
    }
  };

  const downloadResult = (customBlob?: Blob, customFormat?: string) => {
    const blobToDownload = customBlob || result?.blob;
    const formatToUse = customFormat || targetFormat;
    if (!blobToDownload) return;

    const url = URL.createObjectURL(blobToDownload);
    const link = document.createElement("a");
    link.href = url;
    link.download = `converted_${Date.now()}.${formatToUse === "jpeg" ? "jpg" : formatToUse}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveToHistory = async (blob: Blob, originalName: string, format: string) => {
    await db.history.add({
      toolUrl: "/image-converter",
      toolName: "Image Converter",
      input: { originalName, targetFormat: format, quality: format === "png" ? "N/A" : quality },
      result: { size: blob.size, format: format.toUpperCase() },
      file: {
        blob: blob,
        name: `converted_${originalName.split('.')[0]}.${format === "jpeg" ? "jpg" : format}`
      },
      timestamp: Date.now(),
    });
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/image-converter").delete();
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreview(null);
    setResult(null);
    setQuality(90);
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
          <Card className={cn(
            "border-2 border-dashed transition-colors",
            file ? "border-primary bg-primary/5" : "hover:border-primary/30"
          )}>
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
                    <p className="text-lg font-bold">Select Image to Convert</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Convert between standard formats with local processing.
                    </p>
                    <Button className="mt-6 font-semibold" onClick={() => (document.getElementById('upload') as HTMLInputElement)?.click()}>
                        Choose File
                    </Button>
                  </Label>
                </div>
              ) : (
                <div className="space-y-8">
                  {!result ? (
                    <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row gap-8 items-center">
                            <div className="w-full sm:w-1/3 aspect-square rounded  bg-muted overflow-hidden border relative group">
                                <img src={preview!} alt="Preview" className="w-full h-full object-cover" />
                                <button 
                                    onClick={reset}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                            
                            <div className="w-full sm:w-2/3 space-y-6">
                                <div className="grid grid-cols-1 gap-3">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Format</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {(["jpeg", "png", "webp", "avif"] as SupportedFormat[]).map((f) => (
                                            <Button 
                                                key={f}
                                                variant={targetFormat === f ? "default" : "outline"} 
                                                size="sm" 
                                                className="h-9 text-xs font-bold uppercase"
                                                onClick={() => setTargetFormat(f)}
                                            >
                                                {f === "jpeg" ? "JPG" : f}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {targetFormat !== "png" && (
                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conversion Quality</Label>
                                            <span className="text-sm font-black text-primary">{quality}%</span>
                                        </div>
                                        <Slider 
                                            value={[quality]} 
                                            onValueChange={(v) => setQuality(v[0])} 
                                            max={100} 
                                            min={10} 
                                            step={1}
                                            className="py-2"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative w-full aspect-square sm:aspect-4/3 max-w-md mx-auto bg-white rounded shadow-2xl overflow-hidden flex items-center justify-center border-8 border-muted">
                        <img 
                          src={result.url} 
                          alt="Converted result" 
                          className="max-w-full max-h-full object-contain"
                        />
                        <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                            {result.format}
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm border border-white/20">
                            {formatSize(result.size)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    {!result ? (
                        <>
                            <Button variant="outline" className="flex-1" onClick={reset}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Reset
                            </Button>
                            <Button className="flex-2 font-bold" onClick={convertImage} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                {isProcessing ? "Converting..." : `Convert to ${targetFormat.toUpperCase()}`}
                            </Button>
                        </>
                    ) : (
                      <>
                        <Button variant="outline" className="flex-1" onClick={reset}>
                            <FilePlus className="mr-2 h-4 w-4" /> New Conversion
                        </Button>
                        <Button className="flex-2 font-bold" onClick={() => downloadResult()}>
                          <Download className="mr-2 h-4 w-4" /> Download {result.format}
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
                            <ArrowRightLeft className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-sm line-clamp-1 break-all">{item.input.originalName}</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                                {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold ">
                                {item.result.format}
                            </span>
                            <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-semibold">
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
                                onClick={() => downloadResult(item.file!.blob, item.result.format.toLowerCase())}
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
                    <RefreshCw className="h-6 w-6" />
                </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-center">Converter Pro-Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: "Best for Web", desc: "WebP and AVIF provide the smallest file sizes for websites with excellent quality.", color: "text-amber-500" },
                { title: "Transparency", desc: "Use PNG or WebP if your original image has a transparent background.", color: "text-blue-500" },
                { title: "Compatibility", desc: "JPG is the most widely supported format for older software and systems.", color: "text-green-500" },
              ].map((tip, i) => (
                <div key={i} className="space-y-1.5 p-3 rounded bg-muted/50 border border-transparent hover:border-primary/20 transition-colors">
                    <p className={cn("text-xs font-black uppercase tracking-widest", tip.color)}>{tip.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
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
