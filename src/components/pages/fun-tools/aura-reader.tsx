"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, RefreshCcw, User, Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AURA_COLORS, MOODS } from "@/data/tools/fun-tools/aura-reader";

export default function AuraReader() {
  const searchParams = useSearchParams();

  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(searchParams.get("name") || "");
  const [selectedMood, setSelectedMood] = useState<number | null>(
    searchParams.get("mood") ? parseInt(searchParams.get("mood")!) : null,
  );
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateAura = useCallback((userName: string, moodValue: number) => {
    if (!userName || !moodValue) return null;

    // Simple deterministic hash based on name and mood
    const nameValue = userName
      .toLowerCase()
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const totalValue = nameValue + moodValue * 10;
    return totalValue % AURA_COLORS.length;
  }, []);

  useEffect(() => {
    const n = searchParams.get("name");
    const m = searchParams.get("mood");

    if (n && m) {
      const idx = calculateAura(n, parseInt(m));
      if (idx !== null) {
        setResultIndex(idx);
      }
    } else {
      setResultIndex(null);
    }
  }, [searchParams, calculateAura]);

  const handleCalculate = () => {
    if (name && selectedMood !== null) {
      const idx = calculateAura(name, selectedMood);
      if (idx !== null) {
        setResultIndex(idx);
        const params = new URLSearchParams(searchParams.toString());
        params.set("name", name);
        params.set("mood", selectedMood.toString());
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    }
  };

  const reset = () => {
    setName("");
    setSelectedMood(null);
    setResultIndex(null);
    router.push(pathname, { scroll: false });
  };

  const share = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = window.location.href;
    const aura = resultIndex !== null ? AURA_COLORS[resultIndex] : null;
    if (navigator.share) {
      navigator
        .share({
          title: "My Aura Color Reading",
          text: `My aura color today is ${aura?.name}! ${aura?.description}`,
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

  const aura = resultIndex !== null ? AURA_COLORS[resultIndex] : null;

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mr-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl sm:text-3xl font-extrabold font-display">
          Aura <span className="text-primary">Reader</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Discover the color of your energy based on your name and mood
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Your Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Enter your name"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Label>How are you feeling today?</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 break-all rounded-xl border-2  transition-all hover:bg-accent",
                      selectedMood === mood.value
                        ? "border-primary/80 bg-primary/5 scale-102"
                        : "border-primary/10 bg-muted/50",
                    )}
                  >
                    <span className="text-2xl mb-1">{mood.emoji}</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider">
                      {mood.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                onClick={handleCalculate}
                disabled={!name || selectedMood === null}
              >
                <Sparkles className="mr-2 h-4 w-4 fill-current" /> Read My Aura
              </Button>
              <Button variant="outline" size="icon" onClick={reset}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {aura && (
        <Card className="animate-in zoom-in-95 duration-500 relative overflow-hidden border-none shadow-2xl">
          {/* Background Glow */}
          <div
            className={cn("absolute inset-0 opacity-10 blur-3xl", aura.color)}
          />

          <div className="absolute top-4 right-4 z-20">
            <Tooltip open={copied}>
              <TooltipTrigger asChild onClick={share}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm"
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

          <CardContent className="text-center py-12 relative z-10">
            <div className="relative inline-block mb-6">
              <div
                className={cn(
                  "w-24 h-24 rounded-full mx-auto animate-pulse blur-xl absolute inset-0",
                  aura.color,
                )}
              />
              <div
                className={cn(
                  "w-24 h-24 rounded-full mx-auto relative border-4 border-background shadow-inner",
                  aura.color,
                )}
              />
            </div>

            <CardTitle
              className={cn(
                "text-5xl font-black font-display tracking-tighter uppercase mb-4",
                aura.textColor,
              )}
            >
              {aura.name}
            </CardTitle>

            <div className="max-w-md mx-auto">
              <p className="text-lg font-medium leading-relaxed mb-6">
                {aura.description}
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                {aura.traits.map((trait) => (
                  <span
                    key={trait}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-background/50 backdrop-blur-sm border",
                      aura.textColor,
                    )}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-3">How it works</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The Aura Reader uses a combination of your name's numerological value
          and your current emotional vibration (mood) to determine your energy's
          primary frequency. Each color corresponds to different psychological
          and spiritual states, offering a glimpse into your current energetic
          presence.
        </p>
      </div>
    </div>
  );
}
