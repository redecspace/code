"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Heart, RefreshCcw, User, Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FLAMES_MAP, type FlamesResult } from "@/data/tools/fun-tools/flames";

export default function Flames() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [name1, setName1] = useState(searchParams.get("n1") || "");
  const [name2, setName2] = useState(searchParams.get("n2") || "");
  const [result, setResult] = useState<FlamesResult | null>(null);
  const [copied, setCopied] = useState(false);

  const calculateFlames = useCallback((n1Str: string, n2Str: string) => {
    if (!n1Str || !n2Str) return null;

    let n1 = n1Str.toLowerCase().replace(/\s/g, "").split("");
    let n2 = n2Str.toLowerCase().replace(/\s/g, "").split("");

    const n1Copy = [...n1];
    const n2Copy = [...n2];

    for (let char of n1Copy) {
      const index = n2Copy.indexOf(char);
      if (index > -1) {
        n1.splice(n1.indexOf(char), 1);
        n2.splice(index, 1);
        n2Copy.splice(index, 1);
      }
    }

    const count = n1.length + n2.length;
    if (count === 0) return "S" as FlamesResult;

    let flames = ["F", "L", "A", "M", "E", "S"];
    let pos = 0;
    while (flames.length > 1) {
      pos = (pos + count - 1) % flames.length;
      flames.splice(pos, 1);
    }

    return flames[0] as FlamesResult;
  }, []);

  // Sync and validate result from search params
  useEffect(() => {
    const n1 = searchParams.get("n1");
    const n2 = searchParams.get("n2");
    const r = searchParams.get("r") as FlamesResult;

    if (n1 && n2) {
      const calculatedResult = calculateFlames(n1, n2);
      if (calculatedResult) {
        setResult(calculatedResult);
        // If the URL result is wrong or missing, fix it
        if (calculatedResult !== r) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("r", calculatedResult);
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
      }
    } else {
      setResult(null);
    }
  }, [searchParams, calculateFlames, router, pathname]);

  const handleCalculate = () => {
    const res = calculateFlames(name1, name2);
    if (res) {
      setResult(res);
      const params = new URLSearchParams(searchParams.toString());
      params.set("n1", name1);
      params.set("n2", name2);
      params.set("r", res);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const reset = () => {
    setName1("");
    setName2("");
    setResult(null);
    router.push(pathname, { scroll: false });
  };

  const share = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: "FLAMES Result",
          text: `FLAMES result for ${name1} and ${name2} is ${result ? FLAMES_MAP[result].label : ""}!`,
          url: url,
        })
        .catch(() => {
          copyToClipboard(url);
        });
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mr-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl sm:text-3xl font-extrabold font-display">
          FLAMES <span className="text-primary">Game</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Discover your relationship status with the classic FLAMES game
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name1">Your Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name1"
                  placeholder="Enter first name"
                  className="pl-10"
                  value={name1}
                  onChange={(e) => setName1(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name2">Partner's Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name2"
                  placeholder="Enter second name"
                  className="pl-10"
                  value={name2}
                  onChange={(e) => setName2(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                onClick={handleCalculate}
                disabled={!name1 || !name2}
              >
                <Heart className="mr-2 h-4 w-4  fill-current" /> Calculate
                Relationship
              </Button>
              <Button variant="outline" size="icon" onClick={reset}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Tooltip open={copied}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={share}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Link Copied!</TooltipContent>
            </Tooltip>
          </div>
          <CardHeader className="text-center">
            <CardTitle className="sr-only">Relationship Result</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <div className="text-6xl mb-4">{FLAMES_MAP[result].icon}</div>
            <div
              className={cn(
                "text-4xl font-black font-display tracking-widest uppercase",
                FLAMES_MAP[result].color,
              )}
            >
              {FLAMES_MAP[result].label}
            </div>
            <p className="text-muted-foreground mt-4 italic">
              Between{" "}
              <span className="font-semibold text-foreground">{name1}</span> and{" "}
              <span className="font-semibold text-foreground">{name2}</span>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-3">How it works</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          FLAMES is a popular game named after the acronym: Friends, Lovers,
          Affection, Marriage, Enemies, Siblings. The game works by taking two
          names, removing common letters, and counting the remaining characters.
          This count is then used to cyclically eliminate letters from the word
          "FLAMES" until only one remains.
        </p>
      </div>
    </div>
  );
}
