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
  Braces,
  Eye,
  RefreshCw,
  ImageIcon,
  Maximize,
  Save,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  Network,
  Palette,
  Type,
  Maximize2,
  CircleDot,
  Box,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toPng, toJpeg, toCanvas } from "html-to-image";
import { JSON_TO_IMAGE_CONTENT } from "@/data/tools/image-tools/json-to-image";
import Prism from "prismjs";

// Load JSON language component for the editor
import "prismjs/components/prism-json";

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
        Prism.languages[language] || Prism.languages.json,
        language
      )
    : "";

  const sharedStyles = {
    fontFamily: 'JetBrains Mono, ui-mono, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    padding: '16px',
    margin: '0px',
    paddingBottom: '50px',
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

type PreviewMode = "tree" | "table" | "map";

interface CustomizationSettings {
  borderRadius: number;
  padding: number;
  bgColor: string;
  accentColor: string;
  fontSize: number;
  itemRadius: number;
}

export default function JSONToImage() {
  const { title, description, about, features, steps } = JSON_TO_IMAGE_CONTENT;

  const DEFAULT_JSON = `{
  "id": "redec-001",
  "project": {
    "name": "Project Dashboard",
    "version": "2.4.0",
    "status": "Production"
  },
  "stats": [
    { "label": "Revenue", "value": "$12,400", "trend": "+12%" },
    { "label": "Users", "value": "1,240", "trend": "+5%" },
    { "label": "Latency", "value": "45ms", "trend": "-2ms" }
  ],
  "author": "Besaoct",
  "tags": ["Design", "Dev", "Image"]
}`;

  const [jsonInput, setJsonInput] = useState<string>(DEFAULT_JSON);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("tree");
  const [settings, setSettings] = useState<CustomizationSettings>({
    borderRadius: 24,
    padding: 48,
    bgColor: "#0f172a",
    accentColor: "#6366f1",
    fontSize: 14,
    itemRadius: 8,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"png" | "jpeg" | "webp" | "svg">("png");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [captureElement, setCaptureElement] = useState<HTMLElement | null>(null);

  const history = useLiveQuery(() =>
    db.history.where("toolUrl").equals("/json-to-image").reverse().toArray()
  );

  const handleReset = () => {
    setJsonInput(DEFAULT_JSON);
    setSettings({
      borderRadius: 24,
      padding: 48,
      bgColor: "#0f172a",
      accentColor: "#6366f1",
      fontSize: 14,
      itemRadius: 8,
    });
    toast.success("Editor and settings reset");
  };

  const handlePrettify = () => {
    try {
      const obj = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(obj, null, 2));
      toast.success("JSON prettified");
    } catch (err) {
      toast.error("Invalid JSON format");
    }
  };

  const toWebpLocal = async (el: HTMLElement, options?: any) => {
    const canvas = await toCanvas(el, options);
    return canvas.toDataURL("image/webp", options?.quality || 0.95);
  };

  const handleCapture = async () => {
    if (!captureElement) return;
    
    try {
      JSON.parse(jsonInput);
    } catch (e) {
      toast.error("Please provide valid JSON before capturing.");
      return;
    }

    setIsProcessing(true);

    try {
      const options = {
        cacheBust: true,
        backgroundColor: "transparent",
      };

      if (selectedFormat === "svg") {
        const canvas = await toCanvas(captureElement, options);
        const dataUrl = canvas.toDataURL("image/png");
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image xlink:href="${dataUrl}" width="${canvas.width}" height="${canvas.height}" />
</svg>`;
        const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
        setCapturedBlob(blob);
      } else {
        let dataUrl = "";
        if (selectedFormat === "png") dataUrl = await toPng(captureElement, options);
        else if (selectedFormat === "jpeg") dataUrl = await toJpeg(captureElement, { ...options, quality: 0.95 });
        else dataUrl = await toWebpLocal(captureElement, { ...options, quality: 0.95 });

        const response = await fetch(dataUrl);
        const blob = await response.blob();
        setCapturedBlob(blob);
      }
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
      link.download = `json_${previewMode}_${Date.now()}.${selectedFormat === "jpeg" ? "jpg" : selectedFormat}`;
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
    if (!captureElement) return;
    
    try {
      JSON.parse(jsonInput);
    } catch (e) {
      toast.error("Please provide valid JSON before saving.");
      return;
    }

    setIsProcessing(true);

    try {
      const dataUrl = await toPng(captureElement, { backgroundColor: "transparent" });
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      await db.history.add({
        toolUrl: "/json-to-image",
        toolName: "JSON to Image",
        input: {
          type: `JSON ${previewMode.toUpperCase()}`,
          json: jsonInput,
        },
        result: { size: blob.size },
        file: { blob: blob, name: `json_${previewMode}_${Date.now()}.png` },
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
    if (item.input?.json !== undefined) {
      setJsonInput(item.input.json);
      toast.success("Restored JSON from history");
    }
  };

  const handleHistoryDownload = async (item: any) => {
    setCapturedBlob(item.file.blob);
    setIsFormatDialogOpen(true);
  };

  // Rendering Helpers
  const generateTreeHtml = (data: any): string => {
    if (data === null) return '<span class="v-null">null</span>';
    if (typeof data === 'string') return `<span class="v-string">"${data}"</span>`;
    if (typeof data === 'number') return `<span class="v-number">${data}</span>`;
    if (typeof data === 'boolean') return `<span class="v-boolean">${data}</span>`;
    
    if (Array.isArray(data)) {
      if (data.length === 0) return '<span class="v-dim">[]</span>';
      return `
        <div class="collapsible">
          <div class="line"></div>
          ${data.map(item => `
            <div class="tree-item">
              <span class="bullet" style="background: ${settings.accentColor}"></span>
              ${generateTreeHtml(item)}
            </div>
          `).join('')}
        </div>
      `;
    }
    
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length === 0) return '<span class="v-dim">{}</span>';
      return `
        <div class="collapsible">
          <div class="line" style="border-radius: ${settings.itemRadius}px"></div>
          ${keys.map(key => `
            <div class="tree-item">
              <span class="key" style="color: ${settings.accentColor}">${key}:</span>
              ${generateTreeHtml(data[key])}
            </div>
          `).join('')}
        </div>
      `;
    }
    return String(data);
  };

  // Improved Recursive Table Cell Renderer
  const renderValue = (val: any): string => {
    if (val === null || val === undefined) return '<span class="v-dim">null</span>';
    if (typeof val === 'boolean') return `<span class="v-boolean">${val}</span>`;
    if (typeof val === 'number') return `<span class="v-number">${val}</span>`;
    
    if (Array.isArray(val)) {
      if (val.length === 0) return '<span class="v-dim">[]</span>';
      return `
        <div class="nested-list">
          ${val.map(item => `<div class="nested-list-item">${renderValue(item)}</div>`).join('')}
        </div>
      `;
    }
    
    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length === 0) return '<span class="v-dim">{}</span>';
      return `
        <table class="nested-table">
          ${keys.map(k => `
            <tr>
              <td class="nested-key">${k}</td>
              <td class="nested-val">${renderValue(val[k])}</td>
            </tr>
          `).join('')}
        </table>
      `;
    }

    const isPositive = String(val).startsWith('+') || String(val).toLowerCase() === 'up' || String(val).toLowerCase() === 'active';
    const isNegative = String(val).startsWith('-') || String(val).toLowerCase() === 'down' || String(val).toLowerCase() === 'error';
    const statusClass = isPositive ? 'v-success' : isNegative ? 'v-error' : 'v-text';
    return `<span class="${statusClass}">${val}</span>`;
  };

  const generateTableHtml = (data: any): string => {
    // If it's a root array, treat each item as a row
    if (Array.isArray(data)) {
      if (data.length === 0) return '<div class="v-dim">Empty Array</div>';
      
      const allKeys = new Set<string>();
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(k => allKeys.add(k));
        } else {
          allKeys.add('value');
        }
      });
      const headers = Array.from(allKeys);

      return `
        <div class="table-container" style="border-radius: ${settings.itemRadius}px">
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>${headers.map(h => {
                  const val = typeof row === 'object' && row !== null ? row[h] : (h === 'value' ? row : undefined);
                  return `<td>${renderValue(val)}</td>`;
                }).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    if (typeof data === 'object' && data !== null) {
      return `
        <div class="table-container" style="border-radius: ${settings.itemRadius}px">
          <table>
            <thead>
              <tr><th>Key</th><th>Value</th></tr>
            </thead>
            <tbody>
              ${Object.entries(data).map(([k, v]) => `
                <tr>
                  <td class="root-key">${k}</td>
                  <td>${renderValue(v)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    return renderValue(data);
  };

  const generateMapHtml = (data: any, label = "Root"): string => {
    if (data === null || typeof data !== 'object') {
      return `
        <div class="map-node map-leaf" style="border-left-color: ${settings.accentColor}; border-radius: ${settings.itemRadius}px">
          <div class="map-label">${label}</div>
          <div class="map-value" style="font-size: ${settings.fontSize}px">${data}</div>
        </div>
      `;
    }

    const isArr = Array.isArray(data);
    const children = isArr 
      ? data.map((item, i) => generateMapHtml(item, `[${i}]`))
      : Object.entries(data).map(([k, v]) => generateMapHtml(v, k));

    return `
      <div class="map-branch">
        <div class="map-node map-parent" style="background: ${settings.accentColor}20; color: ${settings.accentColor}; border-color: ${settings.accentColor}40; border-radius: ${settings.itemRadius}px">${label}</div>
        <div class="map-children" style="border-left-color: ${settings.accentColor}30">
          ${children.join('')}
        </div>
      </div>
    `;
  };

  let parsedData = {};
  try {
    parsedData = JSON.parse(jsonInput);
  } catch (e) {}

  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            margin: 0; 
            padding: 80px; 
            background: transparent; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh;
            width: fit-content;
            min-width: 100vw;
            font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
          }
          .canvas-outer {
    
            background: ${settings.bgColor};
            color: #f1f5f9;
            border-radius: ${settings.borderRadius}px;
            box-shadow: 0 40px 80px -15px rgba(0, 0, 0, 0.7);
            padding: ${settings.padding}px;
            display: flex;
            flex-direction: column;
            width: fit-content;
            height: fit-content;
            min-width: 400px;
            border: 1px solid rgba(255,255,255,0.1);
          }
          /* Tree Styles */
          .tree-item { position: relative; padding-left: 28px; margin: 10px 0; display: flex; align-items: center; gap: 8px; white-space: nowrap; font-size: ${settings.fontSize}px; }
          .collapsible { position: relative; margin-left: 16px; }
          .line { position: absolute; left: -16px; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.05)); border-radius: 1px; }
          .bullet { width: 6px; height: 6px; border-radius: 50%; position: absolute; left: -19px; }
          .key { font-weight: 700; font-family: 'JetBrains Mono', monospace; }
          .v-string { color: #4ade80; font-weight: 500; }
          .v-number { color: #fb923c; font-weight: 600; }
          .v-boolean { color: #f472b6; font-weight: 600; }
          .v-null { color: #94a3b8; font-style: italic; }
          .v-dim { color: #475569; }
          
          /* Real Table Styles */
          .table-container { 
            border: 1px solid rgba(255,255,255,0.2); 
            background: rgba(255,255,255,0.02); 
            width: fit-content; 
            min-width: 100%; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
            overflow: hidden; 
          }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { 
            background: rgba(255,255,255,0.1); 
            color: #fff; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: 1.5px; 
            font-size: 11px; 
            padding: 24px 20px; 
            border: 1px solid rgba(255,255,255,0.2);
            white-space: nowrap; 
          }
          td { 
            padding: 20px; 
            border: 1px solid rgba(255,255,255,0.15); 
            font-size: ${settings.fontSize}px; 
            font-weight: 500; 
            vertical-align: top; 
          }
          .root-key { color: ${settings.accentColor}; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
          
          /* Nested Table/List Styles */
          .nested-table { width: 100%; margin: 0; border-collapse: collapse; }
          .nested-table td { 
            padding: 10px 12px; 
            border: 1px solid rgba(255,255,255,0.1); 
            font-size: 0.9em; 
          }
          .nested-key { 
            color: rgba(255,255,255,0.5); 
            font-size: 0.75em; 
            text-transform: uppercase; 
            font-weight: 800; 
            width: 1%; 
            white-space: nowrap; 
            background: rgba(255,255,255,0.03);
          }
          .nested-list { display: flex; flex-direction: column; }
          .nested-list-item { 
            padding: 8px 12px; 
            border-bottom: 1px solid rgba(255,255,255,0.1);
          }
          .nested-list-item:last-child { border-bottom: 0; }
          
          .v-success { color: #10b981; font-weight: 700; }
          .v-error { color: #ef4444; font-weight: 700; }
          tr:nth-child(even) { background: rgba(255,255,255,0.01); }
          
          /* Map Styles */
          .map-branch { display: flex; align-items: center; gap: 40px; position: relative; }
          .map-children { display: flex; flex-direction: column; gap: 16px; position: relative; padding-left: 20px; border-left: 2px solid; }
          .map-node { padding: 12px 20px; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); min-width: 140px; white-space: nowrap; transition: all 0.3s; }
          .map-parent { font-weight: 700; font-size: 14px; z-index: 2; position: relative; }
          .map-leaf { display: flex; flex-direction: column; gap: 4px; border-left: 4px solid; }
          .map-label { color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .map-value { color: #f1f5f9; font-weight: 500; font-family: 'JetBrains Mono', monospace; }
          .map-branch::before { content: ''; position: absolute; left: -40px; width: 40px; height: 2px; background: rgba(255,255,255,0.1); z-index: 1; }
          .map-children > .map-branch::before { left: -20px; width: 20px; }
        </style>
      </head>
      <body>
        <div id="capture-target" class="canvas-outer">
          ${previewMode === 'tree' ? generateTreeHtml(parsedData) : 
            previewMode === 'table' ? generateTableHtml(parsedData) : 
            generateMapHtml(parsedData, "Root")}
        </div>
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
            <Card className="flex flex-col h-125 overflow-hidden border-primary/10">
              <CardHeader className="py-3 border-b flex flex-row items-center justify-between bg-muted/20">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Braces className="h-4 w-4 text-primary" /> JSON Data
                </CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-widest px-3" onClick={handlePrettify}>
                  Prettify
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <CodeEditor
                  value={jsonInput}
                  onChange={setJsonInput}
                  language="json"
                  placeholder="Paste your JSON here..."
                />
              </CardContent>
            </Card>

            <Card className="flex flex-col overflow-hidden border-primary/10">
              <CardHeader className="py-3 border-b flex flex-row items-center justify-between bg-muted/5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> Preview
                </CardTitle>
                <div className="flex bg-muted/50 p-1 gap-1 rounded border">
                  {[
                    { id: "tree", icon: LayoutGrid, label: "Tree" },
                    { id: "table", icon: TableIcon, label: "Table" },
                    { id: "map", icon: Network, label: "Map" }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setPreviewMode(mode.id as PreviewMode)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all",
                        previewMode === mode.id ? "bg-background text-primary shadow-sm ring-1 ring-black/5" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <mode.icon className="h-3.5 w-3.5" /> {mode.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col overflow-hidden bg-muted/30 h-125">
                <div className="flex-1 overflow-hidden flex items-center justify-center">
                  <iframe
                    title="Preview"
                    className="w-full h-full border-0 bg-transparent "
                    srcDoc={iframeSrcDoc}
                    onLoad={(e) => {
                      const iframe = e.currentTarget;
                      const doc = iframe.contentDocument;
                      if (doc) {
                        const target = doc.getElementById("capture-target");
                        setCaptureElement(target);
                      }
                    }}
                  />
                </div>
                
                {/* Customization Toolbar */}
                <div className="p-4 bg-background border-t grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-2">
                      <Maximize2 className="h-3 w-3" /> Canvas
                    </Label>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-medium">
                          <span>Radius</span>
                          <span>{settings.borderRadius}px</span>
                        </div>
                        <Slider 
                          value={[settings.borderRadius]} 
                          max={60} 
                          step={1} 
                          onValueChange={([v]) => setSettings(s => ({ ...s, borderRadius: v }))} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-medium">
                          <span>Padding</span>
                          <span>{settings.padding}px</span>
                        </div>
                        <Slider 
                          value={[settings.padding]} 
                          min={20}
                          max={120} 
                          step={1} 
                          onValueChange={([v]) => setSettings(s => ({ ...s, padding: v }))} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-2">
                      <Palette className="h-3 w-3" /> Colors
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-medium block">Background</span>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            className="h-8 w-8 p-0 border-0 rounded-full cursor-pointer overflow-hidden" 
                            value={settings.bgColor}
                            onChange={(e) => setSettings(s => ({ ...s, bgColor: e.target.value }))}
                          />
                          <span className="text-[10px] font-mono self-center uppercase">{settings.bgColor}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-medium block">Accent</span>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            className="h-8 w-8 p-0 border-0 rounded-full cursor-pointer overflow-hidden" 
                            value={settings.accentColor}
                            onChange={(e) => setSettings(s => ({ ...s, accentColor: e.target.value }))}
                          />
                          <span className="text-[10px] font-mono self-center uppercase">{settings.accentColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-2">
                      <Box className="h-3 w-3" /> Structure
                    </Label>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-medium">
                          <span>Item Radius</span>
                          <span>{settings.itemRadius}px</span>
                        </div>
                        <Slider 
                          value={[settings.itemRadius]} 
                          max={32} 
                          step={1} 
                          onValueChange={([v]) => setSettings(s => ({ ...s, itemRadius: v }))} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-medium">
                          <span>Text Size</span>
                          <span>{settings.fontSize}px</span>
                        </div>
                        <Slider 
                          value={[settings.fontSize]} 
                          min={10}
                          max={24} 
                          step={1} 
                          onValueChange={([v]) => setSettings(s => ({ ...s, fontSize: v }))} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 flex flex-col justify-between">
                    <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-2">
                      <CircleDot className="h-3 w-3" /> Presets
                    </Label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { name: "Slate", bg: "#0f172a", acc: "#6366f1" },
                        { name: "Emerald", bg: "#064e3b", acc: "#10b981" },
                        { name: "Ruby", bg: "#450a0a", acc: "#f43f5e" },
                        { name: "Amber", bg: "#451a03", acc: "#f59e0b" },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          className="h-6 w-6 rounded-full border-2 border-background ring-1 ring-muted transition-transform hover:scale-110"
                          style={{ background: preset.bg }}
                          title={preset.name}
                          onClick={() => setSettings(s => ({ ...s, bgColor: preset.bg, accentColor: preset.acc }))}
                        >
                          <div className="h-2 w-2 rounded-full mx-auto" style={{ background: preset.acc }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4">
            <Button 
              className="flex-1 h-10 uppercase tracking-widest font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]" 
              onClick={handleCapture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Rendering...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" /> Capture {previewMode}
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
            <Card className="rounded-xl overflow-hidden shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-muted/10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  History
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={async () => {
                    await db.history.where("toolUrl").equals("/json-to-image").delete();
                    toast.success("History cleared");
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Clear All
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap gap-4 items-center justify-between p-4 bg-muted/30 rounded-xl border group transition-all hover:border-primary/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 min-w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                        <div className="grid gap-1">
                          <p className="font-bold text-sm tracking-tight">{item.input?.type}</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                            <span className="text-[9px] bg-background text-muted-foreground px-2 py-0.5 rounded border font-semibold uppercase">
                              {formatSize(item.result?.size || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-sm"
                          title="Put Back"
                          onClick={() => putBackFromHistory(item)}
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-sm"
                          title="Download"
                          onClick={() => handleHistoryDownload(item)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
          <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden sticky top-24">
            <div className="p-1 bg-primary/5 border-b flex items-center justify-center py-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <LayoutGrid className="h-6 w-6" />
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg text-center">Visual Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: "Bordered Grid", desc: "Table mode now features a professional bordered grid layout for maximum data clarity.", color: "text-blue-500" },
                { title: "Deep Nesting", desc: "Objects and lists are recursively rendered within their parent cells as nested tables.", color: "text-emerald-500" },
                { title: "Data Integrity", desc: "No data is hidden — every property and array element is rendered in its own bordered space.", color: "text-amber-500" },
              ].map((tip, i) => (
                <div key={i} className="space-y-1.5 p-3 rounded-lg bg-muted/50 border border-transparent hover:border-primary/20 transition-all">
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
              Choose your preferred format for the captured JSON visualization.
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
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all group text-left",
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
            <Button variant="outline" className="rounded-lg" onClick={() => setIsFormatDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={executeDownload} className="flex-2 font-bold rounded-lg px-8">
              Download {previewMode.toUpperCase()} Image
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
      <Card className="rounded-xl overflow-hidden border-primary/5 shadow-sm">
        <CardHeader className="bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Background
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 text-muted-foreground">
          {about.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {p}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-xl overflow-hidden border-primary/5 shadow-sm">
        <CardHeader className="bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Expert Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ul className="space-y-5">
            {features.map((f, i) => (
              <li key={i} className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
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

      <Card className="rounded-xl overflow-hidden border-primary/5 shadow-sm">
        <CardHeader className="bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Operational Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-xl font-black text-primary/20 leading-none">{s.step}</span>
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
