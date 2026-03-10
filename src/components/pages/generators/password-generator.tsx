'use client'

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Copy, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const CHARS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:',.<>?",
};

function calcStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 16) score += 1;
  if (pw.length >= 24) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 1;
  return Math.min(score, 5);
}

const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
const strengthColors = [
  "bg-destructive",
  "bg-destructive",
  "bg-warning",
  "bg-warning",
  "bg-success",
  "bg-success",
];

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
  });

  const generate = useCallback(() => {
    let pool = "";
    if (options.uppercase) pool += CHARS.uppercase;
    if (options.lowercase) pool += CHARS.lowercase;
    if (options.numbers) pool += CHARS.numbers;
    if (options.symbols) pool += CHARS.symbols;
    if (!pool) pool = CHARS.lowercase;
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    return Array.from(arr, (v) => pool[v % pool.length]).join("");
  }, [length, options]);

  const [password, setPassword] = useState(() => generate());

  const regenerate = () => {
    setPassword(generate());
    setCopied(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = calcStrength(password);

  return (
    <div className="max-w-5xl mr-auto animate-fade-in">
      <h1 className="text-xl sm:text-3xl font-bold font-display mb-2">Password {" "}
        <span className="text-primary">Generator</span>
      </h1>
      <p className="text-muted-foreground mb-6 text-sm sm:text-base">Create strong, customizable passwords</p>
      <Card>
        <CardHeader className="px-6 pt-4 pb-4 flex items-center flex-row gap-x-4 flex-wrap w-full ">
          <CardTitle className="text-base">Generated Password</CardTitle>
         <div className="flex gap-2 items-center">
             <Tooltip open={copied}>
                <TooltipTrigger asChild>
                  <Button className="rounded-full" variant="outline" size="icon" onClick={copy}>
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Copied!
                </TooltipContent>
             </Tooltip>
            <Button className="rounded-full"  variant="outline" size="icon" onClick={regenerate}><RefreshCw className="h-4 w-4" /></Button>
         </div>
          </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-muted items-center flex rounded text-sm font-mono break-all select-all border">
              {password}
            </code>
     
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Strength</span>
              <span className="font-medium">{strengthLabels[strength]}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all ${strengthColors[strength]}`}
                style={{ width: `${(strength / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Length: {length}</Label>
            <Slider min={8} max={128} step={1} value={[length]} onValueChange={([v]) => { setLength(v); }} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(options) as Array<keyof typeof options>).map((key) => (
              <div key={key} className="flex items-center justify-between ">
                <Label className="capitalize">{key}</Label>
                <Switch
                  checked={options[key]}
                  onCheckedChange={(checked) => {
                    const newOpts = { ...options, [key]: checked };
                    setOptions(newOpts);
                  }}
                />
              </div>
            ))}
          </div>

          <Button onClick={regenerate} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Generate New Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
