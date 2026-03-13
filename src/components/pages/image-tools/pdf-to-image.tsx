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
  FileText,
  Loader2,
  ImageIcon,
  Maximize,
  Archive,
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
import { PDF_TO_IMAGE_CONTENT } from "@/data/tools/image-tools/pdf-to-image";
import JSZip from "jszip";



export default function PDFToImage() {
  const { title, description, about, features, steps } = PDF_TO_IMAGE_CONTENT;

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<
    { blob: Blob; url: string; pageNumber: number }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"png" | "jpeg" | "webp">(
    "png",
  );
  const [activeDownload, setActiveDownload] = useState<{
    blob: Blob;
    pageNumber: number;
  } | null>(null);

  const history = useLiveQuery(() =>
    db.history.where("toolUrl").equals("/pdf-to-image").reverse().toArray(),
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || selectedFile.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file.");
      return;
    }

    setFile(selectedFile);
    setPages([]);
    setProgress(0);
  };

  const processPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    setPages([]);
    setProgress(0);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      if (!pdfjs) {
         return; 
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const renderedPages: { blob: Blob; url: string; pageNumber: number }[] =
        [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png"),
        );
        const url = URL.createObjectURL(blob);

        renderedPages.push({ blob, url, pageNumber: i });
        setProgress(Math.round((i / pdf.numPages) * 100));
        setPages([...renderedPages]);
      }

      toast.success("PDF successfully converted to images!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to process PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (page: { blob: Blob; pageNumber: number }) => {
    setActiveDownload(page);
    setIsFormatDialogOpen(true);
  };

  const executeDownload = async () => {
    if (!activeDownload) return;
    setIsFormatDialogOpen(false);

    try {
      const img = new Image();
      img.src = URL.createObjectURL(activeDownload.blob);
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Context failed");

      ctx.drawImage(img, 0, 0);

      const mime =
        selectedFormat === "jpeg"
          ? "image/jpeg"
          : selectedFormat === "webp"
            ? "image/webp"
            : "image/png";
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), mime, 0.92),
      );

      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${file?.name.replace(".pdf", "")}_page_${activeDownload.pageNumber}.${selectedFormat === "jpeg" ? "jpg" : selectedFormat}`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`Page ${activeDownload.pageNumber} downloaded!`);
      }
    } catch (err) {
      toast.error("Download failed");
    } finally {
      setActiveDownload(null);
    }
  };

  const downloadAllAsZip = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    const zip = new JSZip();
    const folderName = file?.name.replace(".pdf", "") || "pdf_images";
    const imgFolder = zip.folder(folderName);

    try {
      for (const page of pages) {
        imgFolder?.file(`page_${page.pageNumber}.png`, page.blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${folderName}_images.zip`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("ZIP archive created and downloaded!");
    } catch (err) {
      toast.error("Failed to create ZIP.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (pages.length === 0 || !file) return;

    try {
      // For history, we save a ZIP of all images as the primary "file"
      const zip = new JSZip();
      for (const page of pages) {
        zip.file(`page_${page.pageNumber}.png`, page.blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });

      await db.history.add({
        toolUrl: "/pdf-to-image",
        toolName: "PDF to Image",
        input: {
          fileName: file.name,
          pageCount: pages.length,
          // We store individual blobs in input to "put back" easily
          pageBlobs: pages.map((p) => ({
            blob: p.blob,
            pageNumber: p.pageNumber,
          })),
        },
        result: { size: zipBlob.size },
        file: {
          blob: zipBlob,
          name: `${file.name.replace(".pdf", "")}_all_pages.zip`,
        },
        timestamp: Date.now(),
      });
      toast.success("Saved all pages to history");
    } catch (err) {
      toast.error("Failed to save to history");
    }
  };

  const putBackFromHistory = (item: any) => {
    if (!item.input?.pageBlobs) return;

    const restoredPages = item.input.pageBlobs.map((p: any) => ({
      blob: p.blob,
      url: URL.createObjectURL(p.blob),
      pageNumber: p.pageNumber,
    }));

    setFile(new File([], item.input.fileName, { type: "application/pdf" }));
    setPages(restoredPages);
    toast.success("Restored images from history");
  };

  const reset = () => {
    setFile(null);
    setPages([]);
    setProgress(0);
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
          <Card className="border-2 border-dashed transition-colors hover:border-primary/30">
            <CardContent className="pt-10 pb-10">
              {!file ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <input
                    type="file"
                    id="upload"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileUpload}
                  />
                  <Label htmlFor="upload" className="cursor-pointer">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-semibold">
                      Select PDF to Convert
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Transform PDF pages into high-quality images locally
                    </p>
                    <Button
                      className="mt-6 font-semibold"
                      onClick={() =>
                        (
                          document.getElementById("upload") as HTMLInputElement
                        )?.click()
                      }
                    >
                      Choose PDF
                    </Button>
                  </Label>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded border border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold truncate max-w-50 sm:max-w-100">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.size > 0
                            ? formatSize(file.size)
                            : "Restored from history"}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={reset}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {pages.length === 0 ? (
                    <Button
                      className="w-full h-10 z-10 relative uppercase tracking-widest font-bold"
                      onClick={() => {
                        processPDF();
                        console.log("clicked");
                      }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rendering {progress}%
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-4 w-4" /> Convert to
                          Image(s)
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Button
                          variant="outline"
                          className="h-10 uppercase tracking-widest"
                          onClick={reset}
                        >
                          <FilePlus className="mr-2 h-4 w-4" /> New PDF
                        </Button>

                        <Button
                          className="flex-1 h-10 uppercase tracking-widest font-bold"
                          onClick={downloadAllAsZip}
                        >
                          <Archive className="mr-2 h-4 w-4" /> Download ZIP
                        </Button>
                        <Button
                          variant="secondary"
                          className="h-10 uppercase tracking-widest font-bold flex-1"
                          onClick={handleSaveToHistory}
                        >
                          <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t">
                        {pages.map((page) => (
                          <div
                               onClick={() => handleDownloadSingle(page)}
                            key={page.pageNumber}
                            className="group relative aspect-3/4 border rounded overflow-hidden bg-muted/30"
                          >
                            <img
                              src={page.url}
                              alt={`Page ${page.pageNumber}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-100 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                              <p className="text-white text-xs font-bold mb-2">
                                Page {page.pageNumber}
                              </p>
                              <Button
                                size="sm"
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleDownloadSingle(page)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                        
                            </div>
                            <div className="absolute top-2 left-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                              {page.pageNumber}
                            </div>
                          </div>
                        ))}
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
                  onClick={async () => {
                    await db.history
                      .where("toolUrl")
                      .equals("/pdf-to-image")
                      .delete();
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
                          <Archive className="h-5 w-5 text-primary" />
                        </div>
                        <div className="grid gap-1">
                          <p className="font-medium text-sm break-all line-clamp-1">
                            {item.input?.fileName}
                          </p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">
                              {item.input?.pageCount} PAGES
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
                          title="Put Back"
                          onClick={() => putBackFromHistory(item)}
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          title="Download ZIP"
                          onClick={() => {
                            const url = item.file
                              ? URL.createObjectURL(item.file?.blob)
                              : "#";
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = item.file?.name || "File";
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
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
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-center">
                PDF Rendering Intel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  title: "High DPI",
                  desc: "Every page is rendered at 2x scale for maximum clarity.",
                  color: "text-amber-500",
                },
                {
                  title: "ZIP Bundling",
                  desc: "Export all converted pages at once in a single compressed archive.",
                  color: "text-green-500",
                },
                {
                  title: "Browser Only",
                  desc: "No data is sent to servers. Your PDFs remain private.",
                  color: "text-blue-500",
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
              Choose your preferred image format for this page.
            </p>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-6">
            <div className="grid grid-cols-3 gap-3 w-full">
              {[
                { id: "png", label: "PNG", desc: "Lossless" },
                { id: "jpeg", label: "JPG", desc: "Standard" },
                { id: "webp", label: "WebP", desc: "Optimized" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() =>
                    setSelectedFormat(fmt.id as "png" | "jpeg" | "webp")
                  }
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
              Download Page {activeDownload?.pageNumber}
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
