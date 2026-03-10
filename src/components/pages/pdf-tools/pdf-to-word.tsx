'use client'

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileUp, 
  Download, 
  Trash2, 
  History, 
  Info, 
  Star, 
  ListChecks, 
  FileText,
  Loader2,
  CheckCircle2,
  Settings2,
  FilePlus,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDF_TO_WORD_CONTENT } from "@/data/tools/pdf-tools/pdf-to-word";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { convertPDFToWord } from "@/lib/tools/pdf/pdf-to-word";

export default function PDFToWord() {
  const { title, description, about, features, steps } = PDF_TO_WORD_CONTENT;
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isGsMode, setIsGsMode] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const history = useLiveQuery(
    () => db.history.where("toolUrl").equals("/pdf-to-word").reverse().toArray()
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setResult(null);
      setProgress("");
    } else if (selectedFile) {
      toast.error("Please select a valid PDF file");
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsConverting(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();

      const docxBlob = await convertPDFToWord(arrayBuffer, {
        isGsMode,
        onProgress: setProgress
      });

      const url = URL.createObjectURL(docxBlob);
      const outputName = file.name.replace(/\.pdf$/i, '') + ".docx";

      const convertResult = {
        url,
        name: outputName,
        size: docxBlob.size
      };

      setResult(convertResult);
      
      // Save to history
      await db.history.add({
        toolUrl: "/pdf-to-word",
        toolName: "PDF to Word",
        input: { fileName: file.name, isGsMode },
        result: { size: convertResult.size },
        file: { blob: docxBlob, name: outputName },
        timestamp: Date.now(),
      });

      toast.success("Document converted successfully!");
    } catch (error: any) {
      console.error("Conversion error:", error);
      toast.error(`Failed to convert: ${error.message}`);
    } finally {
      setIsConverting(false);
      setProgress("");
    }
  };

  const downloadFromHistory = (item: any) => {
    if (!item.file?.blob) return;
    const url = URL.createObjectURL(item.file.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.file.name;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloading Word file...");
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/pdf-to-word").delete();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-5xl mr-auto animate-fade-in">
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
            file ? "border-primary/50 bg-primary/5" : "hover:border-primary/30"
          )}>
            <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              
              {!file ? (
                <>
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileUp className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1  tracking-tight">Select PDF File</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                    Upload your PDF to transform it into an editable Word document.
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} className="font-semibold  ">
                    Choose File
                  </Button>
                </>
              ) : (
                <div className="w-full max-w-md">
                  <div className="flex items-center gap-4 p-4 bg-background rounded border-2 mb-6 text-left">
                    <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{file.name}</p>
                      <p className="text-[10px] font-semibold text-muted-foreground ">{formatSize(file.size)}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={reset} disabled={isConverting}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {!result && (
                    <div className="space-y-4 mb-6 text-left p-4 bg-background rounded border-2">
                      <div className="flex gap-2 flex-wrap items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-bold uppercase   text-muted-foreground">Conversion</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="gs-mode" className="text-[10px] font-semibold  text-muted-foreground">Premium</Label>
                          <Switch 
                            id="gs-mode" 
                            checked={isGsMode} 
                            onCheckedChange={setIsGsMode} 
                            disabled={isConverting}
                          />
                        </div>
                      </div>
                      <p className="text-xs  text-muted-foreground leading-relaxed tracking-tight">
                        {isGsMode 
                          ? "Premium mode uses advanced layout analysis for better formatting." 
                          : "Standard mode uses high-speed text extraction."}
                      </p>
                    </div>
                  )}

                  {!result ? (
                    <div className="space-y-4">
                      <Button 
                           className="w-full h-14 text-lg  uppercase font-black tracking-widest " 
                        onClick={handleConvert} 
                        disabled={isConverting}
                      >
                        {isConverting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Converting...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-5 w-5" />
                            Convert to Word
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
                    <div className="flex flex-wrap w-full gap-3">
                      <Button asChild className=" flex-1 h-10 font-semibold text-base" variant="default">
                        <a href={result.url} download={result.name}>
                          <Download className="mr-2 h-5 w-5" />
                          Download Word
                        </a>
                      </Button>
                      <Button variant="outline" className=" flex-1 h-10 font-semibold text-base"  onClick={reset}>
                        <FilePlus className="mr-2 h-5 w-5" />
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold  text-[10px]"
                  onClick={clearAllHistory}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Clear All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center justify-between p-3 bg-muted/30 rounded border group">          
                     <div className="flex flex-col gap-1">
                        <p className="font-semibold text-sm truncate max-w-45 sm:max-w-xs">{item.input.fileName}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-[9px] font-medium  bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {formatSize(item.result.size)}
                          </span>
                          <span className="text-[9px] font-medium  bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            {item.input.isGsMode ? "Premium" : "Standard"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          title="Download"
                          onClick={() => downloadFromHistory(item)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
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
                <CardTitle className="text-lg font-semibold  ">Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded">
                  <Wand2 className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div className="text-left">
                    <p className="font-semibold text-xs mb-1  tracking-tight text-foreground">Extraction</p>
                    <p className="text-[11px]  leading-relaxed text-muted-foreground ">
                      Our engine extracts text and preserves basic layouts locally. For complex tables, Premium mode is recommended.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div className="text-left">
                    <p className="font-semibold text-xs mb-1  tracking-tight text-foreground">Privacy</p>
                    <p className="text-[11px]  leading-relaxed text-muted-foreground ">
                      No data is ever sent to a server. Processing is 100% browser-based for total document security.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ConvertResultCard({ result }: { result: any }) {
  return (
    <Card className="h-full border-t-4 border-t-primary  animate-in fade-in zoom-in-95 duration-500">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-lg text-center font-semibold  ">Document Ready</CardTitle>
      </CardHeader>
      <CardContent className="pt-8 space-y-8 text-center">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <div>
          <p className="text-base font-black text-primary  ">{(result.size / 1024).toFixed(0)} KB</p>
          <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.2em] mt-1 ">Final Word Size</p>
        </div>
        <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded text-left border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-[11px] font-semibold text-green-700 leading-relaxed ">
            Conversion complete. The Word file is optimized for editing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ToolInfo({ about, features, steps }: { about: string[], features: any[], steps: any[] }) {
  return (
    <>
      <Card >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2   ">
            <Info className="h-5 w-5 text-primary" />
            Background
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {about.map((p, i) => (
            <p key={i} className="text-sm text-muted-foreground   tracking-tight">
              {p}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2   ">
            <Star className="h-5 w-5 text-primary" />
            Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-5">
            {features.map((f, i) => (
              <li key={i} className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold  tracking-tight text-foreground/90">{f.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed ">{f.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2  ">
            <ListChecks className="h-5 w-5 text-primary" />
            Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-xl font-black text-muted-foreground/80 leading-none">{s.step}</span>
                <div className="text-left">
                  <p className="text-sm font-semibold   text-foreground/90">{s.title}</p>
                  <p className="text-xs  text-muted-foreground leading-relaxed ">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
