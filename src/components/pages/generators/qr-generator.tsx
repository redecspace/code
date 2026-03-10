'use client'


import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Download } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function QRGenerator() {
  const [text, setText] = useState("https://redec.space");
  const [fgColor, setFgColor] = useState("#6C3AED");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [size, setSize] = useState(256);
  const canvasRef = useRef<HTMLDivElement>(null);

  const download = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.png";
    a.click();
  };

  return (
    <div className="max-w-5xl mr-auto animate-fade-in">
      <h1 className="text-xl sm:text-3xl font-bold font-display mb-6">QR Code <span className="text-primary">Generator</span></h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Settings</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-2">
              <Label>URL or Text</Label>
              <Textarea value={text} className="max-h-64" onChange={(e) => setText(e.target.value)} placeholder="Enter URL or text" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Size: {size}px</Label>
              <Slider min={128} max={512} step={32} value={[size]} onValueChange={([v]) => setSize(v)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
                <Label>Foreground</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="h-9 w-9 rounded min-w-9 cursor-pointer border border-input" />
                  <Input value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
      <div className="flex flex-col gap-2">
                <Label>Background</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-9 w-9 min-w-9 cursor-pointer border border-input placeholder:border-4 rounded" />
                  <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
          <CardContent className="flex flex-col  gap-4 mx-auto justify-center items-center overflow-hidden w-full">
            <div ref={canvasRef} className="bg-card overflow-x-auto w-full mx-auto justify-center items-center">
              <QRCodeCanvas
                value={text || " "}
                size={size}
                fgColor={fgColor}
                bgColor={bgColor}
                className="border border-border rounded p-2 mx-auto"
                level="H"
              />
            </div>
            <Button onClick={download} className="w-full">
              <Download className="mr-2 h-4 w-4" /> Download PNG
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
