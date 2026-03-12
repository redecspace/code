"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Type,
  Image as ImageIcon,
  X,
  Maximize,
  CheckCircle2,
  Move,
  Settings2,
  Zap,
} from "lucide-react";
import { cn, formatSize } from "@/lib/utils";
import { WATERMARK_IMAGE_CONTENT } from "@/data/tools/image-tools/watermark";
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

type WatermarkType = "text" | "image";

export default function WatermarkImage() {
  const { title, description, about, features, steps } = WATERMARK_IMAGE_CONTENT;
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; blob: Blob } | null>(null);
  
  // Watermark Settings
  const [type, setType] = useState<WatermarkType>("text");
  const [text, setText] = useState("REDEC.SPACE");
  const [logo, setLogo] = useState<string | null>(null);
  const [opacity, setBgOpacity] = useState(0.5);
  const [scale, setScale] = useState(0.2); // Relative scale
  const [rotation, setRotation] = useState(0);
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState({ x: 50, y: 50 }); // percentage of image
  const [imageDims, setImageDims] = useState({ width: 0, height: 0, left: 0, top: 0 });

  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
  const [activeBlob, setActiveBlob] = useState<Blob | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const history = useLiveQuery(() =>
    db.history.where("toolUrl").equals("/watermark-image").reverse().toArray(),
  );

  const updateImageDims = () => {
    if (imgRef.current) {
      const img = imgRef.current;
      setImageDims({
        width: img.clientWidth,
        height: img.clientHeight,
        left: img.offsetLeft,
        top: img.offsetTop,
      });
    }
  };

  useEffect(() => {
    window.addEventListener("resize", updateImageDims);
    return () => window.removeEventListener("resize", updateImageDims);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setResult(null);
      const reader = new FileReader();
      reader.onload = (event) => setPreview(event.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => setLogo(event.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current || !imgRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const img = imgRef.current;
    
    const imgWidth = img.clientWidth;
    const imgHeight = img.clientHeight;
    const imgLeft = img.offsetLeft;
    const imgTop = img.offsetTop;

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = "touches" in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      // Local container pixels
      let xPx = clientX - containerRect.left;
      let yPx = clientY - containerRect.top;

      // Clamp to image content area
      xPx = Math.max(imgLeft, Math.min(imgLeft + imgWidth, xPx));
      yPx = Math.max(imgTop, Math.min(imgTop + imgHeight, yPx));

      // Map to 0-100% of image dimensions
      const x = ((xPx - imgLeft) / imgWidth) * 100;
      const y = ((yPx - imgTop) / imgHeight) * 100;
      setPosition({ x, y });
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

  const applyWatermark = async () => {
    if (!preview || !file) return;
    setIsProcessing(true);

    try {
      const mainImg = new Image();
      mainImg.src = preview;
      await new Promise(r => mainImg.onload = r);

      const canvas = document.createElement("canvas");
      canvas.width = mainImg.naturalWidth;
      canvas.height = mainImg.naturalHeight;
      const ctx = canvas.getContext("2d")!;

      ctx.drawImage(mainImg, 0, 0);

      ctx.globalAlpha = opacity;
      ctx.translate((position.x / 100) * canvas.width, (position.y / 100) * canvas.height);
      ctx.rotate((rotation * Math.PI) / 180);

      if (type === "text") {
        const fontSize = canvas.width * (scale / 5); 
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 0, 0);
      } else if (logo) {
        const logoImg = new Image();
        logoImg.src = logo;
        await new Promise(r => logoImg.onload = r);
        const w = canvas.width * scale;
        const h = (logoImg.naturalHeight / logoImg.naturalWidth) * w;
        ctx.drawImage(logoImg, -w / 2, -h / 2, w, h);
      }

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Processing failed");
        const url = URL.createObjectURL(blob);
        setResult({ url, blob });
        setIsProcessing(false);
        await saveToHistory(blob);
        toast.success("Watermark applied!");
      }, file.type, 0.9);

    } catch (e) {
      toast.error("Failed to apply watermark");
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
      link.download = `watermarked_${Date.now()}.${selectedFormat === "jpeg" ? "jpg" : selectedFormat}`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      toast.error("Download failed");
    }
    setActiveBlob(null);
  };

  const saveToHistory = async (blob: Blob) => {
    await db.history.add({
      toolUrl: "/watermark-image",
      toolName: "Watermark Image",
      input: { type, text: type === 'text' ? text : 'Logo' },
      result: { size: blob.size },
      file: { blob, name: `watermarked_${Date.now()}.png` },
      timestamp: Date.now(),
    });
  };

  const putBackFromHistory = (item: any) => {
    if (!item.file?.blob) return;
    if (result) URL.revokeObjectURL(result.url);
    const blob = item.file.blob;
    const url = URL.createObjectURL(blob);
    setFile(new File([blob], "history_item.png", { type: "image/png" }));
    setPreview(url);
    setResult({ url, blob });
    toast.success("Loaded from history");
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/watermark-image").delete();
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreview(null);
    setResult(null);
    setLogo(null);
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
          <Card className={cn(
            "border-2 border-dashed transition-colors",
            file ? "border-primary/50 bg-primary/5" : "hover:border-primary/30"
          )}>
            <CardContent className="pt-10 pb-10">
              {!file ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <input type="file" id="upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  <Label htmlFor="upload" className="cursor-pointer">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-lg font-semibold">Select Base Image</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      The image you want to protect with a watermark.
                    </p>
                    <Button className="mt-6 font-semibold" onClick={() => (document.getElementById('upload') as HTMLInputElement)?.click()}>
                        Choose File
                    </Button>
                  </Label>
                </div>
              ) : (
                <div className="space-y-6">
                  {!result ? (
                    <div className="flex flex-col gap-6">
                      <div ref={containerRef} className="relative w-full aspect-square sm:aspect-4/3 bg-black rounded overflow-hidden flex items-center justify-center cursor-crosshair touch-none select-none @container-[size]">
                        <img ref={imgRef} src={preview!} alt="Base" className="max-w-full max-h-full object-contain pointer-events-none" onLoad={updateImageDims} />
                        
                        <div 
                          className="absolute flex items-center justify-center pointer-events-auto cursor-move z-20 group"
                          style={{ 
                            left: `${imageDims.left + (position.x * imageDims.width / 100)}px`, 
                            top: `${imageDims.top + (position.y * imageDims.height / 100)}px`, 
                            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                            opacity: opacity,
                            width: type === 'image' ? `${scale * imageDims.width}px` : 'auto',
                          }}
                          onMouseDown={handleDrag}
                          onTouchStart={handleDrag}
                        >
                          {type === "text" ? (
                            <span style={{ 
                              color: color, 
                              fontSize: `${imageDims.width * (scale / 5)}px`, 
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              textShadow: '0 0 4px rgba(0,0,0,0.5)',
                              display: 'block'
                            }}>
                              {text}
                            </span>
                          ) : (
                            logo ? <img src={logo} className="w-full h-auto" alt="Logo" /> : <ImageIcon className="h-10 w-10 text-white/50" />
                          )}
                          <div className="absolute -inset-2.5 border-2 border-primary/50 border-dashed rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-background rounded border space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Settings2 className="h-4 w-4 text-primary" />
                            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Watermark Type</Label>
                          </div>
                          <div className="flex gap-2">
                            <Button variant={type === 'text' ? 'default' : 'outline'} size="sm" className="flex-1 rounded font-semibold" onClick={() => setType('text')}>
                              <Type className="mr-2 h-4 w-4" /> Text
                            </Button>
                            <Button variant={type === 'image' ? 'default' : 'outline'} size="sm" className="flex-1 rounded font-semibold" onClick={() => setType('image')}>
                              <ImageIcon className="mr-2 h-4 w-4" /> Logo
                            </Button>
                          </div>

                          {type === 'text' ? (
                            <div className="space-y-3 pt-2">
                              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter watermark text..." className="h-9 rounded" />
                              <div className="flex items-center gap-3">
                                <Label className="text-xs">Color</Label>
                                <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 p-0 border-none bg-transparent cursor-pointer" />
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                              <Button variant="secondary" className="w-full h-9 rounded font-semibold text-xs" onClick={() => (document.getElementById('logo-upload') as HTMLInputElement)?.click()}>
                                {logo ? 'Change Logo' : 'Upload PNG Logo'}
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-background rounded border space-y-5">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Opacity</Label>
                              <span className="text-[10px] font-bold">{Math.round(opacity * 100)}%</span>
                            </div>
                            <Slider value={[opacity * 100]} onValueChange={(v) => setBgOpacity(v[0] / 100)} max={100} step={1} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Size</Label>
                              <span className="text-[10px] font-bold">{Math.round(scale * 100)}%</span>
                            </div>
                            <Slider value={[scale * 100]} onValueChange={(v) => setScale(v[0] / 100)} max={100} step={1} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Rotation</Label>
                              <span className="text-[10px] font-bold">{rotation}°</span>
                            </div>
                            <Slider value={[rotation]} onValueChange={(v) => setRotation(v[0])} min={-180} max={180} step={1} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative w-full aspect-4/3  mx-auto bg-black rounded shadow-2xl overflow-hidden flex items-center justify-center  @container-[size]">
                        <img src={result.url} alt="Result" className="max-w-full max-h-full object-contain" />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    {!result ? (
                      <>
                        <Button variant="outline" className="flex-1 h-10 rounded font-semibold uppercase tracking-wider" onClick={reset}>
                          <X className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                        <Button className="flex-2  font-bold rounded uppercase tracking-wider h-10" onClick={applyWatermark} disabled={isProcessing}>
                          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                          Apply & Process
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" className="flex-1 rounded font-semibold uppercase tracking-wider h-10" onClick={reset}>
                          <FilePlus className="mr-2 h-4 w-4" /> New Image
                        </Button>
                        <Button className="flex-2 font-semibold rounded uppercase tracking-wider h-10" onClick={() => handleDownloadClick()}>
                          <Download className="mr-2 h-4 w-4" /> Export Result
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
                  <History className="h-5 w-5 text-primary" /> History
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={clearAllHistory}>
                  <Trash2 className="h-4 w-4 mr-2" /> Clear All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="flex flex-wrap gap-4 items-center justify-between p-4 bg-muted/30 rounded border group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center text-primary">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                        <div className="grid gap-1">
                          <p className="font-semibold text-sm break-all line-clamp-1">{
                           item.file?.name || "Watermarked Image" }</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                            <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-semibold uppercase">
                              {formatSize(item.result?.size || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.file?.blob && (
                          <>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" title="Put back" onClick={() => putBackFromHistory(item)}>
                              <Maximize className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full bg-background" title="Download" onClick={() => handleDownloadClick(item.file!.blob)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive" title="Delete" onClick={() => deleteHistoryItem(item.id)}>
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
                <Move className="h-6 w-6" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-center">Overlay Intel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: "Positioning", desc: "Drag the watermark anywhere on the image for perfect placement.", color: "text-amber-500" },
                { title: "Logo Prep", desc: "For best results, upload PNG logos with a transparent background.", color: "text-blue-500" },
                { title: "Transparency", desc: "Lower the opacity to make the watermark subtle and non-intrusive.", color: "text-green-500" },
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
              <Download className="h-5 w-5 text-primary" /> Export Format
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-left">
              Choose your preferred format. All processing is local and high-quality.
            </p>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-6">
            <div className="grid grid-cols-3 gap-3 w-full">
              {(
                [
                  { id: "jpeg", label: "JPG", desc: "Standard" },
                  { id: "png", label: "PNG", desc: "Lossless" },
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
                  <span className={cn("text-sm font-bold", selectedFormat === fmt.id ? "text-primary" : "text-foreground")}>
                    {fmt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                    {fmt.desc}
                  </span>
                  {selectedFormat === fmt.id && <div className="h-1 w-1 bg-primary rounded-full mt-1" />}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="sm:justify-between gap-3">
            <Button variant="outline" className="rounded" onClick={() => setIsFormatDialogOpen(false)}>Cancel</Button>
            <Button onClick={executeDownload} className="flex-2 font-bold rounded uppercase tracking-wider">
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
            <Info className="h-5 w-5 text-primary" /> Background
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {about.map((p, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" /> Expert Capabilities
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
            <ListChecks className="h-5 w-5 text-primary" /> Operational Steps
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
