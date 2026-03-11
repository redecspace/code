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
  AlertCircle,
  Settings2,
  FilePlus,
  Scissors
} from "lucide-react";
import { cn, downloadFromHistory } from "@/lib/utils";
import { SPLIT_PDF_CONTENT } from "@/data/tools/pdf-tools/split-pdf";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { splitPDFClient } from "@/lib/tools/pdf/split";

export default function SplitPDF() {
  const { title, description, about, features, steps } = SPLIT_PDF_CONTENT;
  const [file, setFile] = useState<File | null>(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isGsMode, setIsGsMode] = useState(false);
  const [progress, setProgress] = useState("");
  const [startPage, setStartPage] = useState("1");
  const [endPage, setEndPage] = useState("1");
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const history = useLiveQuery(
    () => db.history.where("toolUrl").equals("/split-pdf").reverse().toArray()
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setResult(null);
      setProgress("");
      setStartPage("1");
      setEndPage("1");
    } else if (selectedFile) {
      toast.error("Please select a valid PDF file");
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    const start = parseInt(startPage);
    const end = parseInt(endPage);

    if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
      toast.error("Please enter a valid page range.");
      return;
    }

    setIsSplitting(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();

      const splitBytes = await splitPDFClient(arrayBuffer, {
        isGsMode,
        startPage: start,
        endPage: end,
        onProgress: setProgress
      });

      const blob = new Blob([splitBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const outputName = `split_${start}-${end}_${file.name}`;

      const splitResult = {
        url,
        name: outputName,
        size: blob.size
      };

      setResult(splitResult);
      
      // Save to history
      await db.history.add({
        toolUrl: "/split-pdf",
        toolName: "Split PDF",
        input: { fileName: file.name, range: `${start}-${end}`, isGsMode },
        result: { size: splitResult.size },
        file: { blob: blob, name: outputName },
        timestamp: Date.now(),
      });

      toast.success("PDF split successfully!");
    } catch (error: any) {
      console.error("Split error:", error);
      toast.error(`Failed to split PDF: ${error.message}`);
    } finally {
      setIsSplitting(false);
      setProgress("");
    }
  };

  // const downloadFromHistory = (item: any) => {
  //   if (!item.file?.blob) return;
  //   const url = URL.createObjectURL(item.file.blob);
  //   window.open(url, '_blank');
  //   toast.success("Opening PDF from history...");
  // };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/split-pdf").delete();
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
                  <h3 className="text-lg font-semibold mb-1">Select PDF File</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                    Choose a PDF document to extract specific pages or a range.
                  </p>
                  <Button className="font-semibold  "  onClick={() => fileInputRef.current?.click()}>
                    Choose File
                  </Button>
                </>
              ) : (
                <div className="w-full max-w-md">
                  <div className="flex items-center gap-4 p-4 bg-background rounded border mb-6 text-left">
                    <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={reset} disabled={isSplitting}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {!result && (
                    <div className="space-y-6 mb-6 text-left p-4 bg-background rounded border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Range Settings</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="gs-mode" className="text-[10px] font-bold uppercase text-muted-foreground">Redecium</Label>
                          <Switch 
                            id="gs-mode" 
                            checked={isGsMode} 
                            onCheckedChange={setIsGsMode} 
                            disabled={isSplitting}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="start">Start Page</Label>
                          <Input 
                            id="start" 
                            type="number" 
                            min="1" 
                            value={startPage} 
                            onChange={(e) => setStartPage(e.target.value)} 
                            disabled={isSplitting}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="end">End Page</Label>
                          <Input 
                            id="end" 
                            type="number" 
                            min="1" 
                            value={endPage} 
                            onChange={(e) => setEndPage(e.target.value)} 
                            disabled={isSplitting}
                          />
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-muted-foreground  leading-relaxed">
                        {isGsMode 
                          ? "Redecium mode uses Ghostscript WASM for high-accuracy splitting." 
                          : "Standard mode uses high-speed local extraction."}
                      </p>
                    </div>
                  )}

                  {!result ? (
                    <div className="space-y-4">
                      <Button 
                         className="w-full h-14 text-lg  uppercase font-black tracking-widest " 
                        onClick={handleSplit} 
                        disabled={isSplitting}
                      >
                        {isSplitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Splitting...
                          </>
                        ) : (
                          "Split PDF"
                        )}
                      </Button>
                      {progress && (
                        <p className="text-[10px] font-bold text-primary animate-pulse uppercase tracking-widest text-center">
                          {progress}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap w-full gap-2">
                      <Button asChild className=" flex-1 h-10 font-semibold text-base"  variant="default">
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-5 w-5" />
                          Download
                        </a>
                      </Button>
                      <Button variant="outline" className=" flex-1 h-10 font-semibold text-base"  onClick={reset}>
                        <FilePlus className="mr-2 h-5 w-5" />
                        Start Over
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result Card for Mobile */}
          {result && (
            <div className="xl:hidden h-fit">
              <SplitResultCard result={result} formatSize={formatSize} />
            </div>
          )}

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
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center justify-between p-3 bg-muted/30 rounded border group">          
                          <div className="flex flex-col gap-1">
                        <p className="font-bold text-sm truncate max-w-45 sm:max-w-xs">{item.input.fileName}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <p className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            Pages {item.input.range}
                          </p>
                          <p className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            {formatSize(item.result.size)} ({item.input.isGsMode ? "Redecium" : "Standard"})
                          </p>
                  
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
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
            <SplitResultCard result={result} formatSize={formatSize} />
          ) : (
            <Card className="border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="text-lg">Split Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-muted rounded">
                  <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-muted-foreground text-left">
                    Select a PDF file and define the page range you wish to extract. For example, if you enter Start: 1 and End: 5, only the first five pages will be saved.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SplitResultCard({ result, formatSize }: { result: any, formatSize: (b: number) => string }) {
  return (
    <Card className="h-full border-t-4 border-t-primary overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg text-center">Split Result</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-center">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Scissors className="h-12 w-12 text-primary" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-muted/50 text-left">
            <span className="text-xs text-muted-foreground">New File Name</span>
            <span className="text-sm font-bold truncate max-w-37.5">{result.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 text-left">
            <span className="text-xs text-muted-foreground">New File Size</span>
            <span className="text-sm font-bold text-primary">{formatSize(result.size)}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-green-500/5 rounded text-left">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Your document has been split. You can now download the extracted pages.
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
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
            Key Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {features.map((f, i) => (
              <li key={i} className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
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
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xl font-black text-muted-foreground/80 leading-none">{s.step}</span>
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
