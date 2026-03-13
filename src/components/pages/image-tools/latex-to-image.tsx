"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  History,
  Trash2,
  Info,
  Star,
  ListChecks,
  Camera,
  RefreshCw,
  ImageIcon,
  Sigma,
  Eye,
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
import { toPng, toJpeg } from "html-to-image";
import katex from "katex";
import "katex/dist/katex.min.css";

import { LATEX_TO_IMAGE_CONTENT } from "@/data/tools/image-tools/latex-to-image";

export default function LaTeXToImage() {
  const { title, description, about, features, steps } = LATEX_TO_IMAGE_CONTENT;

  const [latex, setLatex] = useState<string>(
    `f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi) e^{2\\pi i x \\xi} d\\xi`
  );
  const [fontSize, setFontSize] = useState<number>(24);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"png" | "jpeg">("png");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const renderRef = useRef<HTMLDivElement>(null);

  const history = useLiveQuery(() =>
    db.history.where("toolUrl").equals("/latex-to-image").reverse().toArray()
  );

  useEffect(() => {
    if (renderRef.current) {
      try {
        katex.render(latex, renderRef.current, {
          throwOnError: false,
          displayMode: true,
        });
      } catch (err) {
        console.error("KaTeX render error:", err);
      }
    }
  }, [latex, fontSize]);

  const handleCapture = async () => {
    if (!previewRef.current) return;
    setIsProcessing(true);

    try {
      const options = {
        cacheBust: true,
        backgroundColor: "white",
        style: {
          padding: '40px',
        }
      };

      let dataUrl = "";
      if (selectedFormat === "png") dataUrl = await toPng(previewRef.current, options);
      else dataUrl = await toJpeg(previewRef.current, { ...options, quality: 0.95 });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      setCapturedBlob(blob);
      setIsFormatDialogOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to capture equation image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDownload = async () => {
    if (!capturedBlob) return;
    setIsFormatDialogOpen(false);

    try {
      const url = URL.createObjectURL(capturedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `latex_capture_${Date.now()}.${selectedFormat === "jpeg" ? "jpg" : "png"}`;
      link.click();
      URL.revokeObjectURL(url);

      // Save to history
      await db.history.add({
        toolUrl: "/latex-to-image",
        toolName: "LaTeX to Image",
        input: { type: "LaTeX Formula" },
        result: { size: capturedBlob.size },
        file: { blob: capturedBlob, name: `latex_capture_${Date.now()}.${selectedFormat}` },
        timestamp: Date.now(),
      });

      toast.success("Equation image saved!");
    } catch (err) {
      toast.error("Download failed");
    } finally {
      setCapturedBlob(null);
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="flex flex-col h-100">
              <CardHeader className="py-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sigma className="h-4 w-4 text-primary" /> LaTeX Editor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <Textarea
                  value={latex}
                  onChange={(e) => setLatex(e.target.value)}
                  className="h-full w-full rounded-none border-0 focus-visible:ring-0 resize-none font-mono text-xs p-4 bg-background leading-relaxed"
                  placeholder="Enter LaTeX formula here (e.g., E = mc^2)..."
                />
              </CardContent>
            </Card>

            <Card className="flex flex-col h-100">
              <CardHeader className="py-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> Live Preview
                </CardTitle>
                <div className="flex items-center gap-2">
                   <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Size</Label>
                   <input 
                    type="range" 
                    min="12" max="48" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-20 h-1 bg-muted rounded-full appearance-none"
                   />
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center ">
                <div 
                  ref={previewRef}
                  className="bg-white text-slate-900 p-10 rounded shadow-sm min-w-50 flex items-center justify-center"
                >
                  <div ref={renderRef} style={{ fontSize: `${fontSize}px` }} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4">
            <Button 
              className="flex-1 h-12 uppercase tracking-widest font-bold" 
              onClick={handleCapture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Rendering...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" /> Capture Formula
                </>
              )}
            </Button>
          </div>

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
                    await db.history.where("toolUrl").equals("/latex-to-image").delete();
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
                          <p className="font-medium text-sm break-all line-clamp-1">{item.input?.type}</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                            <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-semibold uppercase">
                              {formatSize(item.result?.size || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => {
                    const url =item.file?  URL.createObjectURL(item.file.blob): "/#";
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = item.file?.name || "";
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
                <Sigma className="h-6 w-6" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-center">LaTeX Intel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: "Math Mode", desc: "Our editor supports standard math-mode commands for equations.", color: "text-amber-500" },
                { title: "High DPI", desc: "Captured images are high-resolution and suitable for slides or papers.", color: "text-green-500" },
                { title: "Local Logic", desc: "Formulas are rendered locally. No data is sent to external servers.", color: "text-blue-500" },
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
              Choose your preferred format for the LaTeX capture.
            </p>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-6">
            <div className="grid grid-cols-2 gap-3 w-full">
              {[
                { id: "png", label: "PNG", desc: "High Quality" },
                { id: "jpeg", label: "JPG", desc: "Standard" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id as "png" | "jpeg")}
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
              Download Formula
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
