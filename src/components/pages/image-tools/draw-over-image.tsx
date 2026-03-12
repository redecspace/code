"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Download,
  Upload,
  History,
  Trash2,
  Info,
  Star,
  ListChecks,
  FilePlus,
  Pencil,
  Eraser,
  RotateCcw,
  X,
  FileImage,
  Maximize,
  Palette,
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
import { DRAW_OVER_IMAGE_CONTENT } from "@/data/tools/image-tools/draw-over-image";

export default function DrawOverImage() {
  const { title, description, about, features, steps } = DRAW_OVER_IMAGE_CONTENT;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(null);

  const [brushColor, setBrushColor] = useState<string>("#ef4444");
  const [brushSize, setBrushSize] = useState<number>(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasAnnotations, setHasAnnotations] = useState(false);
  const [tool, setTool] = useState<"draw" | "erase">("draw");

  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"png" | "jpeg" | "webp">("png");

  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const history = useLiveQuery(() =>
    db.history.where("toolUrl").equals("/draw-over-image").reverse().toArray()
  );

  // Canvas setup
  useEffect(() => {
    const annotationCanvas = annotationCanvasRef.current;
    if (!annotationCanvas) return;

    const ctx = annotationCanvas.getContext("2d");
    if (!ctx) return;
    annotationCtxRef.current = ctx;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [file]);

  // Redraw image when preview changes
  useEffect(() => {
    if (preview) {
      redrawImage();
    }
  }, [preview]);

  const resizeCanvas = () => {
    const imgCanvas = imageCanvasRef.current;
    const annCanvas = annotationCanvasRef.current;
    if (!imgCanvas || !annCanvas || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Capture current annotations before resize
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = annCanvas.width;
    tempCanvas.height = annCanvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) tempCtx.drawImage(annCanvas, 0, 0);

    // Resize both
    [imgCanvas, annCanvas].forEach((canvas) => {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    });

    const annCtx = annotationCtxRef.current;
    if (annCtx) {
      annCtx.scale(dpr, dpr);
      annCtx.lineCap = "round";
      annCtx.lineJoin = "round";
      // Restore annotations scaled (simplified restoration)
      annCtx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
    }

    const imgCtx = imgCanvas.getContext("2d");
    if (imgCtx) {
      imgCtx.scale(dpr, dpr);
      redrawImage();
    }
  };

  const redrawImage = () => {
    const canvas = imageCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    if (preview) {
      const img = new Image();
      img.src = preview;
      img.crossOrigin = "anonymous";

      const drawImage = () => {
        const scale = Math.min(
          canvas.width / (img.width * dpr),
          canvas.height / (img.height * dpr)
        );
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width / dpr - w) / 2;
        const y = (canvas.height / dpr - h) / 2;
        ctx.drawImage(img, x, y, w, h);
      };

      img.onload = drawImage;
      if (img.complete) drawImage();
    }
  };

  // ── Drawing handlers ────────────────────────────────────────────────
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!annotationCanvasRef.current || !annotationCtxRef.current) return;
    setIsDrawing(true);

    const canvas = annotationCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    const x = ((e.clientX - rect.left) * (canvas.width / rect.width)) / dpr;
    const y = ((e.clientY - rect.top) * (canvas.height / rect.height)) / dpr;

    const ctx = annotationCtxRef.current;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === "draw" ? brushColor : "#000000";
    ctx.globalCompositeOperation = tool === "erase" ? "destination-out" : "source-over";
    ctx.lineWidth = brushSize;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !annotationCanvasRef.current || !annotationCtxRef.current) return;

    const canvas = annotationCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio;
    const x = ((e.clientX - rect.left) * (canvas.width / rect.width)) / dpr;
    const y = ((e.clientY - rect.top) * (canvas.height / rect.height)) / dpr;

    annotationCtxRef.current.lineTo(x, y);
    annotationCtxRef.current.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    annotationCtxRef.current?.closePath();
    updateResultFromCanvas();
  };

  const updateResultFromCanvas = async () => {
    const blob = await getMergedBlob("png");
    if (blob) {
      const url = URL.createObjectURL(blob);
      setResult({ url, blob });
    }
  };

  const clearCanvas = () => {
    const ctx = annotationCtxRef.current;
    if (ctx && annotationCanvasRef.current) {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, annotationCanvasRef.current.width / dpr, annotationCanvasRef.current.height / dpr);
      setResult(null);
    }
  };

  // ── File handling ───────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }

    setFile(selectedFile);
    setResult(null);
    clearCanvas();

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(selectedFile);
  };

  const getMergedBlob = (format: "png" | "jpeg" | "webp" = "png"): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const imgCanvas = imageCanvasRef.current;
      const annCanvas = annotationCanvasRef.current;
      if (!imgCanvas || !annCanvas) return resolve(null);

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = imgCanvas.width;
      finalCanvas.height = imgCanvas.height;
      const fCtx = finalCanvas.getContext("2d");
      if (!fCtx) return resolve(null);

      // Draw background image layer
      fCtx.drawImage(imgCanvas, 0, 0);
      // Draw annotation layer on top
      fCtx.drawImage(annCanvas, 0, 0);

      const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
      const quality = format === "png" ? undefined : 0.92;
      finalCanvas.toBlob((b) => resolve(b), mime, quality);
    });
  };

  // ── Download logic ──────────────────────────────────────────────────
  const handleDownloadClick = (premadeBlob?: Blob) => {
    if (premadeBlob) {
      setResult({ url: URL.createObjectURL(premadeBlob), blob: premadeBlob });
      setIsFormatDialogOpen(true);
    } else if (result?.blob) {
      setIsFormatDialogOpen(true);
    } else {
      getMergedBlob("png").then((blob) => {
        if (blob) {
          setResult({ url: URL.createObjectURL(blob), blob });
          setIsFormatDialogOpen(true);
        } else {
          toast.error("No image to download");
        }
      });
    }
  };

  const executeDownload = async () => {
    setIsFormatDialogOpen(false);
    if (!result?.blob) {
      toast.error("No image available");
      return;
    }

    try {
      const finalBlob = await getMergedBlob(selectedFormat);
      if (!finalBlob) throw new Error("Blob creation failed");

      const url = URL.createObjectURL(finalBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `annotated_${Date.now()}.${selectedFormat === "jpeg" ? "jpg" : selectedFormat}`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Download started!");
    } catch (err) {
      toast.error("Download failed");
      console.error(err);
    }
  };

  // ── History save / load ─────────────────────────────────────────────
  const handleSaveToHistory = async () => {
    const blob = result?.blob || (await getMergedBlob("png"));
    if (!blob || !file) {
      toast.error("Nothing to save");
      return;
    }

    try {
      await db.history.add({
        toolUrl: "/draw-over-image",
        toolName: "Draw Over Image",
        input: { fileName: file.name },
        result: { size: blob.size },
        file: {
          blob,
          name: `annotated_${file.name.split(".")[0] || "image"}.png`,
        },
        timestamp: Date.now(),
      });
      toast.success("Saved to history");
    } catch (err) {
      toast.error("Failed to save");
    }
  };

  const putBackFromHistory = (item: any) => {
    if (!item?.file?.blob) {
      toast.error("No valid image in history item");
      return;
    }

    const blob = item.file.blob;
    const url = URL.createObjectURL(blob);

    setFile(new File([blob], item.input?.fileName || "annotated.png", { type: "image/png" }));
    setPreview(url);
    setResult({ url, blob });
    clearCanvas();

    toast.success("Loaded for editing");
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    clearCanvas();
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/draw-over-image").delete();
    toast.success("History cleared");
  };

  const deleteHistoryItem = async (id?: number) => {
    if (id) await db.history.delete(id);
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
                    <p className="text-lg font-semibold">Select Image to Annotate</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Draw, highlight, redact or sketch — fully local processing
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
                  <div className="flex flex-col gap-4 items-center">
                    <div
                      ref={containerRef}
                      className="w-full max-w-3xl aspect-4/3 rounded border overflow-hidden bg-muted/30 relative"
                    >
                      <canvas
                        ref={imageCanvasRef}
                        className="absolute inset-0 pointer-events-none"
                      />
                      <canvas
                        ref={annotationCanvasRef}
                        className="absolute inset-0 touch-none z-10"
                        onPointerDown={startDrawing}
                        onPointerMove={draw}
                        onPointerUp={stopDrawing}
                        onPointerOut={stopDrawing}
                      />

                      <button
                        onClick={reset}
                        className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors z-20"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="w-full max-w-3xl flex flex-wrap gap-4 items-center justify-center py-4 border-t">
                      <div className="flex items-center gap-3">
                        <Button
                          variant={tool === "draw" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTool("draw")}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Draw
                        </Button>
                        <Button
                          variant={tool === "erase" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTool("erase")}
                        >
                          <Eraser className="mr-2 h-4 w-4" /> Erase
                        </Button>
                        <Button variant="outline" size="sm" onClick={clearCanvas}>
                          <RotateCcw className="mr-2 h-4 w-4" /> Clear
                        </Button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Palette className="h-5 w-5 text-muted-foreground" />
                          <Input
                            type="color"
                            value={brushColor}
                            onChange={(e) => setBrushColor(e.target.value)}
                            className="h-8 w-12 p-1 rounded"
                          />
                        </div>

                        <div className="flex items-center gap-3 min-w-45">
                          <Label className="text-sm whitespace-nowrap">
                            Size: {brushSize}px
                          </Label>
                          <Slider
                            value={[brushSize]}
                            min={2}
                            max={60}
                            step={1}
                            onValueChange={([v]) => setBrushSize(v)}
                            className="w-32"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full ">
                      <Button
                        variant="outline"
                        className="flex-1 h-10 uppercase tracking-wider"
                        onClick={reset}
                      >
                        <FilePlus className="mr-2 h-4 w-4" /> New Image
                      </Button>
                      <Button
                        className="flex-1 h-10 border-0 uppercase tracking-wider"
                        onClick={() => handleDownloadClick()}
                      >
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-10 border-0 uppercase tracking-wider"
                        onClick={handleSaveToHistory}
                      >
                        Save
                      </Button>
                    </div>
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
                          <FileImage className="h-5 w-5 text-primary" />
                        </div>
                        <div className="grid gap-1">
                          <p className="font-medium text-sm break-all line-clamp-1">
                            {item.input?.fileName || "Untitled"}
                          </p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                            <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-semibold uppercase">
                              PNG
                            </span>
                            <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-semibold uppercase">
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
                              title="Load back"
                              onClick={() => putBackFromHistory(item)}
                            >
                              <Maximize className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              title="Download"
                              onClick={() => handleDownloadClick(item.file?.blob)}
                            >
                              <Download className="h-4 w-4" />
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
                <Pencil className="h-6 w-6" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-center">Annotation Intel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: "Precision", desc: "Smaller brush for details, larger for highlights.", color: "text-amber-500" },
                { title: "Erase Tool", desc: "Removes only your drawings — original image stays safe.", color: "text-green-500" },
                { title: "Local Only", desc: "All drawing & saving happens in your browser.", color: "text-blue-500" },
              ].map((tip, i) => (
                <div
                  key={i}
                  className="space-y-1.5 p-3 rounded bg-muted/50 border border-transparent hover:border-primary/20 transition-colors"
                >
                  <p className={cn("text-xs font-bold uppercase tracking-widest", tip.color)}>
                    {tip.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Format Selection Dialog ── */}
      <Dialog open={isFormatDialogOpen} onOpenChange={setIsFormatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export Format
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-left">
              Choose format — your annotations will be preserved.
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
                    selectedFormat === fmt.id
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/30 bg-muted/30"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-bold",
                      selectedFormat === fmt.id ? "text-primary" : "text-foreground"
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