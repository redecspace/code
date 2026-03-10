"use client";

import { useState } from "react";
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
  Zap,
  X,
  FileImage,
  Maximize,
} from "lucide-react";
import { cn, formatSize } from "@/lib/utils";
import { REMOVE_BG_CONTENT } from "@/data/tools/image-tools/remove-bg";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import  imglyRemoveBackground,{ removeBackground, Config } from "@imgly/background-removal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function RemoveBackground() {
  const { title, description, about, features, steps } = REMOVE_BG_CONTENT;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(
    null,
  );

  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"png" | "jpeg" | "webp">(
    "png",
  );
  const [activeBlob, setActiveBlob] = useState<Blob | null>(null);

  const history = useLiveQuery(() =>
    db.history.where("toolUrl").equals("/remove-bg").reverse().toArray(),
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setResult(null);
      setProgress(null);
      const reader = new FileReader();
      reader.onload = (event) => setPreview(event.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile) {
      toast.error("Please upload a valid image file.");
    }
  };

  const handleRemoveBackground = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress("Initializing AI engine...");

    const public_path = "https://huggingface.co/datasets/redecspace/serve/resolve/main/photo-editor/dist/";

    const config: Config = {
      publicPath: public_path, // path to the wasm files
    };
    const image_src: ImageData | ArrayBuffer | Uint8Array | Blob | URL | string = file;


    try {
  
      const blob = await removeBackground(image_src, {
       publicPath: config.publicPath,
        progress: (key, current, total) => {
          // const percent = Math.round((current / total) * 100);
          setProgress(`Processing: %`);
        },
      });

      const url = URL.createObjectURL(blob);
      setResult({ url, blob });
      setIsProcessing(false);
      setProgress(null);
      await saveToHistory(blob, file.name);
      toast.success("Background removed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove background");
      setIsProcessing(false);
      setProgress(null);
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

      if (selectedFormat === "jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = `removed_bg_${Date.now()}.${selectedFormat === "jpeg" ? "jpg" : selectedFormat}`;
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

  const saveToHistory = async (blob: Blob, originalName: string) => {
    await db.history.add({
      toolUrl: "/remove-bg",
      toolName: "Remove Background",
      input: { fileName: originalName },
      result: { size: blob.size },
      file: {
        blob: blob,
        name: `removed_bg_${originalName.split(".")[0]}.png`,
      },
      timestamp: Date.now(),
    });
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/remove-bg").delete();
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreview(null);
    setResult(null);
    setProgress(null);
  };

  const copyToClipboard = async () => {
    if (!result) return;
    try {
      const item = new ClipboardItem({ "image/png": result.blob });
      await navigator.clipboard.write([item]);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy image");
    }
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
              file
                ? "border-primary/50 bg-primary/5"
                : "hover:border-primary/30",
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
                    <p className="text-lg font-semibold">
                      Select Image to Process
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Best for portraits and product photos. 100% private and
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
                  <div className="flex flex-col gap-6 items-center">
                    <div className="w-full max-w-md aspect-square rounded bg-black overflow-hidden border relative group shrink-0 flex items-center justify-center">
                      <img
                        src={result?.url || preview!}
                        alt="Preview"
                        className={cn(
                          "w-full h-full object-contain",
                          result
                            ? "bg-[url('/placeholder.svg')] bg-repeat"
                            : "",
                        )}
                      />
                      {result && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          Subject Extracted
                        </div>
                      )}
                      <button
                        onClick={reset}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>

                    {!result && (
                      <div className="w-full space-y-6 max-w-md">
                        <div className="p-4 bg-background rounded border space-y-4">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-primary" />
                            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                              Local Processing
                            </Label>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Our AI engine will now identify and extract the main
                            subject. This uses your device's power to ensure
                            maximum privacy.
                          </p>
                        </div>

                        {!isProcessing && (
                          <Button
                            className="w-full h-12 font-bold uppercase tracking-widest"
                            onClick={handleRemoveBackground}
                          >
                            <Zap className="mr-2 h-4 w-4" /> Remove Background
                          </Button>
                        )}

                        {isProcessing && (
                          <div className="space-y-4">
                            <Button
                              className="w-full h-12 font-semibold"
                              disabled
                            >
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing Subject...
                            </Button>
                            {progress && (
                              <p className="text-[10px] font-bold text-primary animate-pulse uppercase tracking-widest text-center">
                                {progress}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {result && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 max-w-md mx-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t">
                        <Button
                          variant="outline"
                          className="h-11 font-semibold uppercase tracking-wider"
                          onClick={reset}
                        >
                          <FilePlus className="mr-2 h-4 w-4" /> New Image
                        </Button>
                        <Button
                          className="h-11 font-semibold uppercase tracking-wider"
                          onClick={() => handleDownloadClick()}
                        >
                          <Download className="mr-2 h-4 w-4" /> Download
                        </Button>
                      </div>
                    </div>
                  )}
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
                          <FileImage className="h-5 w-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium text-sm line-clamp-1">
                            {item.input.fileName}
                          </p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                            <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-bold uppercase">
                              PNG
                            </span>
                            <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-bold uppercase">
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
                <Maximize className="h-6 w-6" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-center">
                Extraction Intel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  title: "Lighting",
                  desc: "Clearly defined subject edges with good contrast yield the best results.",
                  color: "text-amber-500",
                },
                {
                  title: "Hardware",
                  desc: "This process uses your CPU/GPU. Older devices may take a few more seconds.",
                  color: "text-blue-500",
                },
                {
                  title: "Security",
                  desc: "Zero uploads. All AI inference happens in your browser's memory.",
                  color: "text-green-500",
                },
              ].map((tip, i) => (
                <div
                  key={i}
                  className="space-y-1.5 p-3 rounded bg-muted/50 border border-transparent hover:border-primary/20 transition-colors"
                >
                  <p
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest",
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
              Choose your preferred image format for export. PNG is recommended
              for transparency.
            </p>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-6">
            <div className="grid grid-cols-3 gap-3 w-full">
              {(
                [
                  { id: "png", label: "PNG", desc: "Transparent" },
                  { id: "jpeg", label: "JPG", desc: "White BG" },
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
              className="rounded"
              onClick={() => setIsFormatDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={executeDownload}
              className="flex-2 font-bold rounded"
            >
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
                  <p className="text-sm font-semibold ">{s.title}</p>
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
