'use client'

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileUp, 
  Download, 
  Trash2, 
  History, 
  Info, 
  Star, 
  ListChecks, 
  Loader2,
  CheckCircle2,
  Settings2,
  Plus,
  ArrowUp,
  ArrowDown,
  FilePlus,
  Filter,
  Crop as CropIcon,
  X,
  Check
} from "lucide-react";
import { cn, downloadFromHistory } from "@/lib/utils";
import { IMAGE_TO_PDF_CONTENT } from "@/data/tools/pdf-tools/image-to-pdf";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { convertImagesToPDF, ProcessedImage } from "@/lib/tools/pdf/image-to-pdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PerspT from 'perspective-transform';
import { formatSize } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
}

export default function ImageToPDF() {
  const { title, description, about, features, steps } = IMAGE_TO_PDF_CONTENT;
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pageSize, setPageSize] = useState<"A4" | "LETTER" | "ORIGINAL">("A4");
  const [margin, setMargin] = useState([20]);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  
  // Crop State
  const [croppingImage, setCroppingImage] = useState<ProcessedImage | null>(null);
  const [cropPoints, setCropPoints] = useState<Point[]>([]);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const history = useLiveQuery(
    () => db.history.where("toolUrl").equals("/image-to-pdf").reverse().toArray()
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validImages = selectedFiles.filter(f => f.type.startsWith("image/"));
    
    if (validImages.length !== selectedFiles.length) {
      toast.error("Some files were skipped. Only images are allowed.");
    }

    const newProcessedImages: ProcessedImage[] = validImages.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      blob: file,
      previewUrl: URL.createObjectURL(file),
      filter: "none"
    }));

    setImages(prev => [...prev, ...newProcessedImages]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setImages(newImages);
  };

  const updateFilter = (id: string, filter: "none" | "grayscale" | "sharpen") => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, filter } : img));
  };

  const startCropping = (img: ProcessedImage) => {
    setCroppingImage(img);
    setCropPoints([
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 },
    ]);
  };

  const applyCrop = async () => {
    if (!croppingImage) return;
    setIsApplyingCrop(true);

    try {
      const img = new Image();
      img.src = croppingImage.previewUrl;
      await new Promise(resolve => img.onload = resolve);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const outWidth = 1200; 
      const outHeight = 1600; 
      canvas.width = outWidth;
      canvas.height = outHeight;

      const srcPoints = cropPoints.flatMap(p => [
        (p.x / 100) * img.width,
        (p.y / 100) * img.height
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
            const srcIdx = (Math.floor(srcY) * img.width + Math.floor(srcX)) * 4;
            const dstIdx = (y * outWidth + x) * 4;
            imgData.data[dstIdx] = srcData.data[srcIdx];
            imgData.data[dstIdx+1] = srcData.data[srcIdx+1];
            imgData.data[dstIdx+2] = srcData.data[srcIdx+2];
            imgData.data[dstIdx+3] = srcData.data[srcIdx+3];
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Crop failed");
        const newUrl = URL.createObjectURL(blob);
        setImages(prev => prev.map(item => 
          item.id === croppingImage.id ? { ...item, blob, previewUrl: newUrl } : item
        ));
        URL.revokeObjectURL(croppingImage.previewUrl);
        setCroppingImage(null);
        setIsApplyingCrop(false);
        toast.success("Perspective crop applied!");
      }, "image/jpeg", 0.9);

    } catch (e: any) {
      toast.error("Failed to apply crop.");
      setIsApplyingCrop(false);
    }
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setIsConverting(true);
    
    try {
      setProgress("Processing images...");
      const processed = await Promise.all(images.map(async (img) => {
        if (img.filter === "none") return img;
        return { ...img, blob: await applyFilterToBlob(img.blob, img.filter) };
      }));

      const pdfBytes = await convertImagesToPDF(processed, {
        pageSize,
        margin: margin[0],
        onProgress: setProgress
      });

      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const outputName = `images_${Date.now()}.pdf`;

      setResult({ url, name: outputName, size: blob.size });
      
      await db.history.add({
        toolUrl: "/image-to-pdf",
        toolName: "Image to PDF",
        input: { imageCount: images.length, pageSize },
        result: { size: blob.size },
        file: { blob, name: outputName },
        timestamp: Date.now(),
      });

      toast.success("PDF generated successfully!");
    } catch (error: any) {
      toast.error("Conversion failed.");
    } finally {
      setIsConverting(false);
      setProgress("");
    }
  };

  const applyFilterToBlob = (blob: Blob, filter: string): Promise<Blob> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = img.width;
        canvas.height = img.height;
        if (filter === "grayscale") ctx.filter = "grayscale(100%) contrast(1.1)";
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(b => resolve(b || blob), "image/jpeg", 0.9);
      };
      img.src = url;
    });
  };

  // const downloadFromHistory = (item: any) => {
  //   window.open(URL.createObjectURL(item.file.blob), '_blank');
  // };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/image-to-pdf").delete();
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const reset = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setResult(null);
  };

  return (
    <div className="max-w-5xl mr-auto animate-fade-in pb-10">
      <div className="mb-6">
          <h1 className="text-xl sm:text-3xl font-extrabold font-display">
         {title.split(' ')[0]} <span className="text-primary">{title.split(' ').slice(1).join(' ')}</span>
        </h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className={cn(
            "border-2 border-dashed transition-colors",
            images.length > 0 ? "border-primary bg-primary/5" : "hover:border-primary/30"
          )}>
            <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
              <input 
                type="file" 
                accept="image/*" 
                multiple
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              
              {images.length === 0 ? (
                <>
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileUp className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Upload Images</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                    Select photos or scans to convert them into a single PDF document.
                  </p>
                  <Button className="font-semibold  " onClick={() => fileInputRef.current?.click()}>
                    Choose Images
                  </Button>
                </>
              ) : (
                <div className="w-full space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {images.map((img, index) => (
                      <div key={img.id} className="relative h-64 bg-background rounded border-2 overflow-hidden shadow-none hover:border-primary transition-all duration-300 animate-in zoom-in-95 group">
                        <div className="h-full w-full bg-muted relative">
                          <img 
                            src={img.previewUrl} 
                            alt={img.name} 
                            className={cn(
                              "w-full h-full object-contain transition-all duration-300",
                              img.filter === "grayscale" && "grayscale contrast-125"
                            )}
                          />
                          
                          {/* Top Controls: Delete */}
                          <div className="absolute top-2 right-2 flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                            <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-xl" onClick={() => removeImage(img.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Bottom Info & Controls Bar */}
                          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-black/60 to-transparent p-3 pt-12 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <div className="flex justify-between items-end gap-2">
                              <div className="flex-1 min-w-0 text-left">
                                <p className="font-bold text-[10px] text-white uppercase tracking-wider truncate mb-1">{img.name}</p>
                                <span className="text-[9px]  text-white bg-primary px-2 py-0.5 rounded-full">PAGE {index + 1}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <div className="flex gap-1 bg-white/10 backdrop-blur-md rounded p-0.5 border border-white/20">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => moveImage(index, 'up')} disabled={index === 0}>
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => moveImage(index, 'down')} disabled={index === images.length - 1}>
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <div className="flex gap-1 bg-white/10 backdrop-blur-md rounded p-0.5 border border-white/20">
                                  <Button 
                                    variant="ghost"
                                    size="icon" 
                                    className={cn("h-7 w-7", img.filter === "grayscale" ? "bg-primary text-white" : "text-white hover:bg-white/20")}
                                    onClick={() => updateFilter(img.id, img.filter === "grayscale" ? "none" : "grayscale")}
                                  >
                                    <Filter className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-white hover:bg-white/20"
                                    onClick={() => startCropping(img)}
                                  >
                                    <CropIcon className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-64 rounded border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-xs  uppercase tracking-widest text-muted-foreground group-hover:text-primary">Add Pages</span>
                    </button>
                  </div>

                  {!result && (
                    <div className="space-y-6 text-left p-6 bg-background rounded border-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="h-4 w-4 text-primary" />
                        <Label className="text-sm  font-bold uppercase tracking-widest text-muted-foreground">PDF Configuration</Label>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-8">
                        <div className="grid gap-3">
                          <Label htmlFor="page-size" className="font-semibold">Page Format</Label>
                          <Select value={pageSize} onValueChange={(v: any) => setPageSize(v)}>
                            <SelectTrigger id="page-size" className="h-11 font-semibold"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A4">A4 (Standard Document)</SelectItem>
                              <SelectItem value="LETTER">US Letter</SelectItem>
                              <SelectItem value="ORIGINAL">Maintain Image Size</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-3">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="margin" className="font-semibold">Border Margin</Label>
                            <span className="text-xs  text-primary bg-primary/10 px-2 py-0.5 rounded">{margin[0]}PX</span>
                          </div>
                          <Slider 
                            id="margin"
                            value={margin} 
                            onValueChange={setMargin} 
                            max={100} 
                            step={5}
                            className="py-2"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {!result ? (
                    <div className="space-y-4">
                      <Button 
                        className="w-full h-14 text-lg  uppercase font-black tracking-widest " 
                        onClick={handleConvert} 
                        disabled={isConverting || images.length === 0}
                      >
                        {isConverting ? (
                          <>
                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            Generating Professional PDF...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-3 h-6 w-6" />
                            Build My PDF
                          </>
                        )}
                      </Button>
                      {progress && (
                      <p className="text-[10px] font-bold text-primary animate-pulse uppercase tracking-widest text-center">
                          {progress}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap w-full gap-4">
                      <Button asChild  className=" flex-1 h-10 font-semibold text-base" variant="default" >
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-3 h-6 w-6" />
                          Download PDF
                        </a>
                      </Button>
                      <Button variant="outline"       className=" flex-1 h-10 font-semibold text-base" onClick={reset}>
                        <FilePlus className="mr-3 h-6 w-6" />
                        Start New
                      </Button>
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
                <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={clearAllHistory}>
                  <Trash2 className="h-4 w-4 mr-2" /> Clear All
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {history.map((item) => (
                     <div key={item.id} className="flex gap-4 items-center justify-between p-3 bg-muted/30 rounded border group">          
                      
                                <div className="flex flex-col gap-1">
                      <p className="font-semibold text-sm">{item.input.imageCount} Images Document</p>
                      <div className="flex gap-2 mt-1.5">
                        <span className="text-[9px]   bg-primary/10 text-primary px-2 py-0.5 rounded">{item.input.pageSize}</span>
                        <span className="text-[9px]   bg-muted text-muted-foreground px-2 py-0.5 rounded">{formatSize(item.result.size)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full" onClick={() => downloadFromHistory(item)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive" onClick={() => deleteHistoryItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="space-y-6 text-left">
            <ToolInfo about={about} features={features} steps={steps} />
          </div>
        </div>

        <div className="hidden xl:block space-y-6 h-fit">
          {result ? (
            <ConvertResultCard result={result} />
          ) : (
            <Card className="border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="text-lg ">Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded">
                  <Filter className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div className="text-left">
                    <p className="font-bold text-sm mb-1  tracking-tight text-foreground">Filters</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground ">
                      Use the **Scanner Filter** to remove shadows and enhance text contrast for a professional document look.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded">
                  <CropIcon className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div className="text-left">
                    <p className="font-bold text-sm mb-1  tracking-tight text-foreground">Perspective</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground ">
                      Use the **Crop Tool** to fix perspective if your document was photographed at an angle.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Perspective Crop Modal */}
      <Dialog open={!!croppingImage} onOpenChange={() => !isApplyingCrop && setCroppingImage(null)}>
        <DialogContent className="max-w-3xl gap-0 h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="flex items-center gap-3">
              <CropIcon className="h-5 w-5 text-primary" />
              Professional Perspective Crop
            </DialogTitle>
              <p className="text-[10px] text-muted-foreground font-bold  ">
              Drag the four blue circles to the corners of your document.
            </p>
          </DialogHeader>
          
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden touch-none select-none">
            {croppingImage && (
              <div className="relative w-full h-full flex items-center justify-center p-8">
                <div className="relative max-w-full max-h-full">
                  <img 
                    src={croppingImage.previewUrl} 
                    className="max-w-full max-h-[60vh] object-contain block"
                    id="crop-target"
                  />
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    <line x1={`${cropPoints[0].x}%`} y1={`${cropPoints[0].y}%`} x2={`${cropPoints[1].x}%`} y2={`${cropPoints[1].y}%`} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" />
                    <line x1={`${cropPoints[1].x}%`} y1={`${cropPoints[1].y}%`} x2={`${cropPoints[2].x}%`} y2={`${cropPoints[2].y}%`} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" />
                    <line x1={`${cropPoints[2].x}%`} y1={`${cropPoints[2].y}%`} x2={`${cropPoints[3].x}%`} y2={`${cropPoints[3].y}%`} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" />
                    <line x1={`${cropPoints[3].x}%`} y1={`${cropPoints[3].y}%`} x2={`${cropPoints[0].x}%`} y2={`${cropPoints[0].y}%`} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" />
                  </svg>
                  
                  {cropPoints.map((p, i) => (
                    <div 
                      key={i}
                      className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-4 border-white bg-primary shadow-2xl cursor-move flex items-center justify-center z-50 pointer-events-auto touch-none active:scale-125 transition-transform"
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                      onMouseDown={(e) => {
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const initialX = p.x;
                        const initialY = p.y;
                        const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();

                        const onMouseMove = (moveEvent: MouseEvent) => {
                          const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
                          const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;
                          setCropPoints(prev => prev.map((point, idx) => 
                            idx === i ? { x: Math.max(0, Math.min(100, initialX + deltaX)), y: Math.max(0, Math.min(100, initialY + deltaY)) } : point
                          ));
                        };

                        const onMouseUp = () => {
                          document.removeEventListener("mousemove", onMouseMove);
                          document.removeEventListener("mouseup", onMouseUp);
                        };

                        document.addEventListener("mousemove", onMouseMove);
                        document.addEventListener("mouseup", onMouseUp);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

        
                <DialogFooter className="p-6 bg-muted/30 border-t flex gap-4 w-full ">
          
      <div className="flex gap-2 flex-1 justify-end">
              <Button variant="outline" onClick={() => setCroppingImage(null)} disabled={isApplyingCrop}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button onClick={applyCrop} disabled={isApplyingCrop}>
                {isApplyingCrop ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Apply & Flatten
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConvertResultCard({ result }: { result: any }) {
  return (
    <Card className="h-full border-t-4 border-t-primary shadow-sm animate-in fade-in zoom-in-95 duration-500">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-lg text-center  ">Document Ready</CardTitle>
      </CardHeader>
      <CardContent className="pt-8 space-y-8 text-center">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary rotate-0">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <div>
          <p className="text-base font-bold text-primary">{(result.size / 1024).toFixed(0)} KB</p>
          <p className="text-[10px] font-bold  text-muted-foreground tracking-[0.2em] mt-1">Final PDF Size</p>
        </div>
        <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded text-left border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold text-green-700 leading-relaxed ">
            Document optimized and formatted. Ready for immediate use.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ToolInfo({ about, features, steps }: { about: string[], features: any[], steps: any[] }) {
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
            <p key={i} className="text-sm text-muted-foreground leading-relaxed ">
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
        <CardContent className="">
          <ul className="space-y-5">
            {features.map((f, i) => (
          <li key={i} className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold  tracking-tight text-foreground/90">{f.title}</p>
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
        <CardContent className="">
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4">
                     <span className="text-xl font-black text-muted-foreground/80 leading-none">{s.step}</span>
                <div>
                  <p className="text-sm  font-semibold tracking-widest text-foreground/90">{s.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
