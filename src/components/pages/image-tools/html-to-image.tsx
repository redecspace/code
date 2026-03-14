"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  History,
  Trash2,
  Info,
  Star,
  ListChecks,
  Camera,
  Code2,
  Eye,
  RefreshCw,
  ImageIcon,
  Maximize,
  Save,
  RotateCcw,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toPng, toJpeg, toCanvas, toSvg } from "html-to-image";
import { HTML_TO_IMAGE_CONTENT } from "@/data/tools/image-tools/html-to-image";
import Prism from "prismjs";

// Load common languages
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";

const CodeEditor = ({ value, onChange, language, placeholder }: { value: string, onChange: (val: string) => void, language: string, placeholder: string }) => {
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    if (mounted) {
      handleScroll();
    }
  }, [value, mounted]);

  const highlighted = mounted 
    ? Prism.highlight(
        value + (value.endsWith("\n") ? " " : ""),
        Prism.languages[language] || Prism.languages.markup,
        language
      )
    : "";

  const sharedStyles = {
    fontFamily: 'JetBrains Mono, ui-mono, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    padding: '16px',
    margin: '0px',
    paddingBottom: '50px', // Extra space at bottom
    tabSize: 2,
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {mounted && (
        <pre
          ref={preRef}
          className={cn(
            `language-${language} absolute inset-0 m-0 pointer-events-none bg-transparent overflow-hidden whitespace-pre-wrap break-all border-0`
          )}
          style={sharedStyles}
          aria-hidden="true"
          suppressHydrationWarning
        >
          <code 
            className={`language-${language} bg-transparent!`}
            style={{ 
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              padding: 0
            }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
            suppressHydrationWarning
          />
        </pre>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-foreground resize-none border-0 focus:ring-0 outline-none overflow-auto whitespace-pre-wrap break-all"
        style={sharedStyles}
        placeholder={placeholder}
        spellCheck="false"
      />
    </div>
  );
};

export default function HTMLToImage() {
  const { title, description, about, features, steps } = HTML_TO_IMAGE_CONTENT;

  const DEFAULT_HTML =  '<div class="card">\n  <h1>Hello Redec!</h1>\n  <p>Render your HTML to high-quality images locally.</p>\n  <div class="badge">Safe & Secure</div>\n</div>';
  const DEFAULT_CSS =  '.card {\n  font-family: Georgia;\n  padding: 40px;\n  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);\n  color: white;\n  border-radius: 20px;\n  text-align: center;\n  box-shadow: 0 10px 30px rgba(0,0,0,0.2);\n}\n\nh1 {\n  margin: 0 0 10px 0;\n  font-size: 32px;\n}\n\np {\n  opacity: 0.9;\n  font-size: 18px;\n}\n\n.badge {\n  display: inline-block;\n  margin-top: 20px;\n  padding: 8px 16px;\n  background: rgba(255,255,255,0.2);\n  backdrop-filter: blur(10px);\n  border-radius: 100px;\n  font-weight: bold;\n  font-size: 14px;\n}';

  const [html, setHtml] = useState<string>(DEFAULT_HTML);
  const [css, setCss] = useState<string>(DEFAULT_CSS);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"png" | "jpeg" | "webp" | "svg">("png");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const history = useLiveQuery(() =>
    db.history.where("toolUrl").equals("/html-to-image").reverse().toArray()
  );

  const handleReset = () => {
    setHtml(DEFAULT_HTML);
    setCss(DEFAULT_CSS);
    toast.success("Snippet reset to default");
  };

  const toWebpLocal = async (el: HTMLElement, options?: any) => {
    const canvas = await toCanvas(el, options);
    return canvas.toDataURL("image/webp", options?.quality || 0.95);
  };

  const getCaptureElement = () => {
    const iframe = iframeRef.current;
    if (!iframe) return null;
    return iframe.contentDocument?.getElementById("capture-target") || null;
  };

  const handleCapture = async () => {
    setIsProcessing(true);
    
    // Small delay to ensure iframe content is fully settled
    await new Promise(resolve => setTimeout(resolve, 150));

    const captureElement = getCaptureElement();
    if (!captureElement) {
      toast.error("Preview not ready");
      setIsProcessing(false);
      return;
    }

    try {
      const options = {
        cacheBust: true,
        backgroundColor: "transparent",
      };

      let dataUrl = "";
      if (selectedFormat === "svg") {
        dataUrl = await toSvg(captureElement, options);
      } else if (selectedFormat === "png") {
        dataUrl = await toPng(captureElement, options);
      } else if (selectedFormat === "jpeg") {
        dataUrl = await toJpeg(captureElement, { ...options, quality: 0.95 });
      } else {
        dataUrl = await toWebpLocal(captureElement, { ...options, quality: 0.95 });
      }

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      setCapturedBlob(blob);
      setIsFormatDialogOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to capture image.");
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
      link.download = `html_capture_${Date.now()}.${selectedFormat === "jpeg" ? "jpg" : selectedFormat}`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Image downloaded!");
    } catch (err) {
      toast.error("Download failed");
    } finally {
      setCapturedBlob(null);
    }
  };

  const handleSaveToHistory = async () => {
    setIsProcessing(true);
    
    // Small delay to ensure iframe content is fully settled
    await new Promise(resolve => setTimeout(resolve, 150));

    const captureElement = getCaptureElement();
    if (!captureElement) {
      toast.error("Preview not ready");
      setIsProcessing(false);
      return;
    }

    try {
      const dataUrl = await toPng(captureElement, { backgroundColor: "transparent" });
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      await db.history.add({
        toolUrl: "/html-to-image",
        toolName: "HTML to Image",
        input: {
          type: "HTML/CSS Snippet",
          html: html,
          css: css
        },
        result: { size: blob.size },
        file: { blob: blob, name: `html_capture_${Date.now()}.png` },
        timestamp: Date.now(),
      });

      toast.success("Saved to history!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save to history.");
    } finally {
      setIsProcessing(false);
    }
  };

  const putBackFromHistory = (item: any) => {
    if (item.input?.html !== undefined) setHtml(item.input.html);
    if (item.input?.css !== undefined) setCss(item.input.css);
    toast.success("Restored snippet from history");
  };

  const handleHistoryDownload = async (item: any) => {
    setCapturedBlob(item.file.blob);
    setIsFormatDialogOpen(true);
  };

  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background: transparent; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh;
          }
          .capture-container {
            display: inline-block;
            max-width: 100%;
          }
          ${css}
        </style>
      </head>
      <body>
        <div id="capture-target" class="capture-container">${html}</div>
      </body>
    </html>
  `;

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
          <div className="grid grid-cols-1 gap-6">
            <Card className="flex flex-col h-125 overflow-hidden">
              <CardHeader className="py-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" /> Editor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <Tabs defaultValue="html" className="h-full  gap-0 flex flex-col">
                  <TabsList className="w-full justify-start rounded-none border-b bg-muted/50 p-0 h-10">
                    <TabsTrigger value="html" className="rounded-none h-full px-4 data-[state=active]:bg-background font-bold text-xs uppercase tracking-widest">HTML</TabsTrigger>
                    <TabsTrigger value="css" className="rounded-none h-full px-4 data-[state=active]:bg-background font-bold text-xs uppercase tracking-widest">CSS</TabsTrigger>
                  </TabsList>
                  <TabsContent value="html" className="flex-1 m-0 p-0 h-full overflow-hidden">
                    <CodeEditor
                      value={html}
                      onChange={setHtml}
                      language="markup"
                      placeholder="Enter HTML here..."
                    />
                  </TabsContent>
                  <TabsContent value="css" className="flex-1 m-0 p-0 h-full overflow-hidden">
                    <CodeEditor
                      value={css}
                      onChange={setCss}
                      language="css"
                      placeholder="Enter CSS here..."
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-125">
              <CardHeader className="py-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden bg-muted/30 flex items-center justify-center rounded-none h-full">
                <iframe
                  ref={iframeRef}
                  title="Preview"
                  className="w-full h-full border-0 bg-transparent"
                  srcDoc={iframeSrcDoc}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4">
            <Button 
              className="flex-1 h-10 uppercase tracking-widest font-bold" 
              onClick={handleCapture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Rendering...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" /> Capture
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              className="h-10 px-6 uppercase tracking-widest font-bold"
              onClick={handleSaveToHistory}
              disabled={isProcessing}
            >
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button
              variant="outline"
              className="h-10 px-4"
              title="Reset Editor"
              onClick={handleReset}
              disabled={isProcessing}
            >
              <RotateCcw className="h-4 w-4" />
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
                    await db.history.where("toolUrl").equals("/html-to-image").delete();
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
                          title="Download"
                          onClick={() => handleHistoryDownload(item)}
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
                <Code2 className="h-6 w-6" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-center">Capture Intel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: "Standard CSS", desc: "Use modern CSS like Flexbox or Grid — they render perfectly.", color: "text-amber-500" },
                { title: "Transparency", desc: "Background-less elements will be transparent in PNG exports.", color: "text-green-500" },
                { title: "Font-Safe", desc: "Browser-installed fonts render exactly as they appear in the preview.", color: "text-blue-500" },
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
              Choose your preferred format for the captured image.
            </p>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-6">
            <div className="grid grid-cols-2 gap-3 w-full">
              {[
                { id: "png", label: "PNG", desc: "Transparent" },
                { id: "jpeg", label: "JPG", desc: "Standard" },
                { id: "webp", label: "WebP", desc: "Optimized" },
                { id: "svg", label: "SVG", desc: "Vector" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id as "png" | "jpeg" | "webp" | "svg")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded border-2 transition-all group",
                    selectedFormat === fmt.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30 bg-muted/30"
                  )}
                >
                  <span className={cn("text-sm font-bold", selectedFormat === fmt.id ? "text-primary" : "text-foreground")}>
                    {fmt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{fmt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="sm:justify-between gap-3">
            <Button variant="outline" className="rounded" onClick={() => setIsFormatDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={executeDownload} className="flex-2 font-bold rounded">
              Download 
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" />
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
