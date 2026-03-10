"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Heart, RefreshCcw, User, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { LOVE_MESSAGES } from "@/data/tools/fun-tools/love-calculator";

export default function LoveCalculator() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [name1, setName1] = useState(searchParams.get("n1") || "");
  const [name2, setName2] = useState(searchParams.get("n2") || "");
  const [percentage, setPercentage] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const calculateLove = useCallback((n1: string, n2: string) => {
    if (!n1 || !n2) return null;

    const combined = (n1.toLowerCase().trim() + n2.toLowerCase().trim())
      .split("")
      .sort()
      .join("");
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    // Deterministic percentage between 10 and 100
    return Math.abs(hash % 91) + 10;
  }, []);

  useEffect(() => {
    const n1 = searchParams.get("n1");
    const n2 = searchParams.get("n2");

    if (n1 && n2) {
      const res = calculateLove(n1, n2);
      setPercentage(res);
    } else {
      setPercentage(null);
    }
  }, [searchParams, calculateLove]);

  const handleCalculate = () => {
    if (name1 && name2) {
      const res = calculateLove(name1, name2);
      setPercentage(res);
      const params = new URLSearchParams(searchParams.toString());
      params.set("n1", name1);
      params.set("n2", name2);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const reset = () => {
    setName1("");
    setName2("");
    setPercentage(null);
    router.push(pathname, { scroll: false });
  };

  const share = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: "Love Calculator Result",
          text: `The Love Percentage between ${name1} and ${name2} is ${percentage}%!`,
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

  const getMessage = (pct: number) => {
    return (
      LOVE_MESSAGES.find((m) => pct >= m.min && pct <= m.max) ||
      LOVE_MESSAGES[0]
    );
  };

  const resultMessage = percentage !== null ? getMessage(percentage) : null;

  return (
    <div className="max-w-5xl mr-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl sm:text-3xl font-extrabold font-display">
          Love <span className="text-primary">Calculator</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Test the romantic compatibility between two names
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name1">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name1"
                    placeholder="Enter name"
                    className="pl-10"
                    value={name1}
                    onChange={(e) => setName1(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name2">Second Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name2"
                    placeholder="Enter name"
                    className="pl-10"
                    value={name2}
                    onChange={(e) => setName2(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                onClick={handleCalculate}
                disabled={!name1 || !name2}
              >
                <Heart className="mr-2 h-4 w-4 fill-current text-red-500" />{" "}
                Calculate Love
              </Button>
              <Button variant="outline" size="icon" onClick={reset}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {percentage !== null && resultMessage && (
        <Card className="animate-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
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

          <CardContent className="text-center py-10">
            <div className="relative inline-block mb-6">
              <Heart className="h-32 w-32 text-rose-500 fill-red-500 animate-pulse opacity-20 absolute inset-0" />
              <div className="relative z-10  flex flex-col items-center justify-center h-32 w-32">
                <span className="text-3xl num font-black">{percentage}%</span>
              </div>
            </div>

            <div className="max-w-sm mx-auto mb-8 px-4">
              <Progress
                value={percentage}
                className="h-3 bg-muted"
                indicatorClassName="bg-gradient-to-r from-pink-500 to-red-500"
              />
            </div>

            <div className="text-5xl mb-4">{resultMessage.emoji}</div>
            <CardTitle className="text-2xl font-bold mb-2">
              {resultMessage.message}
            </CardTitle>
            <p className="text-muted-foreground italic">
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
          The Love Calculator uses a custom algorithm that analyzes the
          characters in both names to determine their harmonic resonance. While
          it's just for fun, it uses deterministic calculations so the same two
          names will always produce the same romantic result!
        </p>
      </div>
    </div>
  );
}
