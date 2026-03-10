"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Download,
  Upload,
  History,
  Trash2,
  Info,
  Star,
  ListChecks,
  Loader2,
  Zap,
  Settings2,
  FileText,
  Copy,
  Table,
  FileType,
  Maximize,
  X,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OCR_IMAGE_CONTENT } from "@/data/tools/image-tools/ocr";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import {
  extractTextFromImage,
  exportToPDF,
  exportToWord,
  exportToExcel,
} from "@/lib/tools/image/ocr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function OCRImage() {
  const { title, description, about, features, steps } = OCR_IMAGE_CONTENT;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<"standard" | "premium">("premium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [extractedText, setExtractedText] = useState<string | null>(null);

  // States for download dialog
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [textToDownload, setTextToDownload] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const OCRref = useRef<any>(null);

  const history = useLiveQuery(() =>
    db.history.where("toolUrl").equals("/image-to-text").reverse().toArray(),
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setExtractedText(null);
      setProgress("");
      const reader = new FileReader();
      reader.onload = (event) => setPreview(event.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile) {
      toast.error("Please upload a valid image file.");
    }
  };

  const handleOCR = async () => {
    if (!file) return;
    setIsProcessing(true);
    setExtractedText(null);
    setProgress("Initializing...");

    try {
      let text = "";
      try {
        text = await extractTextFromImage(file, {
          mode,
          OCRref,
          onProgress: (msg) => setProgress(msg),
        });
      } catch (premiumErr) {
        if (mode === "premium") {
          setProgress("Switching to standard engine...");
          text = await extractTextFromImage(file, {
            mode: "standard",
            OCRref,
            onProgress: (msg) => setProgress(msg),
          });
        } else {
          throw premiumErr;
        }
      }

      setExtractedText(text);

      // Save to history - now including full text
      await db.history.add({
        toolUrl: "/image-to-text",
        toolName: "Image to Text",
        input: { fileName: file.name, mode },
        result: {
          textPreview: text.substring(0, 100),
          length: text.length,
          fullText: text,
        },
        timestamp: Date.now(),
      });

      toast.success("Text extracted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to extract text");
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  const copyToClipboard = (text: string | null) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/image-to-text").delete();
  };

  const handleDownloadClick = (text: string) => {
    setTextToDownload(text);
    setIsDownloadDialogOpen(true);
  };

  const executeDownload = async (format: "txt" | "pdf" | "docx" | "xlsx") => {
    if (!textToDownload) return;

    let blob: Blob;
    let finalExtension: string = format;

    try {
      switch (format) {
        case "pdf":
          blob = await exportToPDF(textToDownload);
          break;
        case "docx":
          blob = await exportToWord(textToDownload);
          break;
        case "xlsx":
          blob = await exportToExcel(textToDownload);
          finalExtension = "csv";
          break;
        default:
          blob = new Blob([textToDownload], { type: "text/plain" });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `extracted_text_${Date.now()}.${finalExtension}`;
      link.click();
      URL.revokeObjectURL(url);
      setIsDownloadDialogOpen(false);
    } catch (e) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setExtractedText(null);
    setProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Label htmlFor="upload" className="cursor-pointer">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-bold">Upload Image for OCR</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Supports high-resolution scans. Choose Premium for best
                      accuracy.
                    </p>
                    <Button
                      className="mt-6 font-semibold"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                  </Label>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col gap-6 items-center">
                    <div
                      className="w-full max-w-full aspect-4/3 rounded bg-black
                     overflow-hidden border relative group shrink-0"
                    >
                      <img
                        src={preview!}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={reset}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>

                    {!extractedText && (
                      <div className="w-full space-y-6">
                        <div className="p-4 bg-background rounded border space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Settings2 className="h-4 w-4 text-primary" />
                                  <Label className="text-sm font-bold uppercase text-muted-foreground">
                                OCR Mode
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor="premium-mode"
                                  className="text-[10px] font-bold text-muted-foreground"
                              >
                                PREMIUM
                              </Label>
                              <Switch
                                id="premium-mode"
                                checked={mode === "premium"}
                                onCheckedChange={(val) =>
                                  setMode(val ? "premium" : "standard")
                                }
                                disabled={isProcessing}
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {mode === "premium"
                              ? "Premium mode uses a high-precision engine for advanced document structure analysis and superior accuracy."
                              : "Standard mode is fast and optimized for clean, clear text on high-contrast backgrounds."}
                          </p>
                        </div>

                        {!isProcessing && (
                          <Button
                            className="w-full h-12 font-black uppercase "
                            onClick={handleOCR}
                          >
                            <Zap className="mr-2 h-4 w-4" /> Start Text
                            Extraction
                          </Button>
                        )}

                        {isProcessing && (
                          <div className="space-y-4">
                            <Button className="w-full h-12 font-semibold" disabled>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Extracting...
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

                  {extractedText && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                         <Label className="text-xs font-bold tracking-widest text-primary flex items-center gap-2">
                          <FileText className="h-3 w-3" /> Extracted Result
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                           className="h-7 text-[10px] font-semibold uppercase"
                          onClick={() => copyToClipboard(extractedText)}
                        >
                          <Copy className="mr-1.5 h-3 w-3" /> Copy Text
                        </Button>
                      </div>
                      <div className="bg-background/80 rounded p-4 border min-h-50 max-h-100 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                          {extractedText}
                        </pre>
                      </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                        <Button
                       className="h-9 font-semibold"
                          onClick={() => handleDownloadClick(extractedText)}
                        >
                           <FileDown className=" h-3 w-3" /> Export Text
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
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                                  <p className="font-semibold text-sm line-clamp-1">
                            {item.input.fileName}
                          </p>
                          <div className="flex flex-wrap gap-2 items-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                            <span
                              className={cn(
                                "text-[9px] px-2 py-0.5 rounded font-bold uppercase",
                                item.input.mode === "premium"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {item.input.mode}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.result.fullText && (
                          <>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              title="Download"
                              onClick={() =>
                                handleDownloadClick(item.result.fullText)
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              title="Copy Text"
                              onClick={() =>
                                copyToClipboard(item.result.fullText)
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </>
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
              <CardTitle className="text-lg text-center">OCR Intel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  title: "Resolution",
                  desc: "For best results, use images with at least 300 DPI resolution.",
                  color: "text-amber-500",
                },
                {
                  title: "Orientation",
                  desc: "Ensure the text is horizontal. Sideways text significantly reduces accuracy.",
                  color: "text-blue-500",
                },
                {
                  title: "Security",
                  desc: "All extraction happens in RAM. No images or text ever hit our storage.",
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

      <Dialog
        open={isDownloadDialogOpen}
        onOpenChange={setIsDownloadDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Download Format
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-left">
              Choose your preferred format for the extracted text.
            </p>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-6">
            <div className="grid grid-cols-2 gap-3 w-full">
              {(
                [
                  {
                    id: "txt",
                    label: "Text",
                    desc: "Plain text file",
                    icon: FileText,
                  },
                  {
                    id: "docx",
                    label: "Word",
                    desc: "Microsoft Word",
                    icon: FileType,
                  },
                  {
                    id: "pdf",
                    label: "PDF",
                    desc: "PDF document",
                    icon: FileType,
                  },
                  {
                    id: "xlsx",
                    label: "Excel/CSV",
                    desc: "Data sheet",
                    icon: Table,
                  },
                ] as const
              ).map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => executeDownload(fmt.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all bg-muted/30 border-muted hover:border-primary/30",
                  )}
                >
                  <fmt.icon className="h-5 w-5 text-primary mb-1" />
                  <span className="text-sm font-bold text-foreground">
                    {fmt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                    {fmt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDownloadDialogOpen(false)}
            >
              Cancel
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
