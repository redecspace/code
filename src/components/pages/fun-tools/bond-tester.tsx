"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Users, RefreshCcw, Share2, Check, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { BOND_DATA } from "@/data/tools/fun-tools/bond-tester";

export default function BondTester() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [name1, setName1] = useState(searchParams.get("n1") || "");
  const [name2, setName2] = useState(searchParams.get("n2") || "");
  const [score, setScore] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const calculateBond = useCallback((n1: string, n2: string) => {
    if (!n1 || !n2) return null;

    // We want friendship calculation to be different from the Love calculation
    // So we add a 'friendship_salt' to the hash
    const combined = (
      n1.toLowerCase().trim() +
      n2.toLowerCase().trim() +
      "friendship_salt"
    )
      .split("")
      .sort()
      .join("");
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }

    // Deterministic percentage between 0 and 100
    return Math.abs(hash % 101);
  }, []);

  useEffect(() => {
    const n1 = searchParams.get("n1");
    const n2 = searchParams.get("n2");

    if (n1 && n2) {
      const res = calculateBond(n1, n2);
      setScore(res);
    } else {
      setScore(null);
    }
  }, [searchParams, calculateBond]);

  const handleCalculate = () => {
    if (name1 && name2) {
      const res = calculateBond(name1, name2);
      setScore(res);
      const params = new URLSearchParams(searchParams.toString());
      params.set("n1", name1);
      params.set("n2", name2);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const reset = () => {
    setName1("");
    setName2("");
    setScore(null);
    router.push(pathname, { scroll: false });
  };

  const share = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = window.location.href;
    const bond = score !== null ? getBondData(score) : null;

    if (navigator.share && bond) {
      navigator
        .share({
          title: "Friendship Bond Result",
          text: `My bond with ${name2} is "${bond.type}" (${score}%)! ${bond.emoji}`,
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

  const getBondData = (pct: number) => {
    return (
      BOND_DATA.find((b) => pct >= b.scoreRange[0] && pct <= b.scoreRange[1]) ||
      BOND_DATA[0]
    );
  };

  const result = score !== null ? getBondData(score) : null;
  const ResultIcon = result?.icon || Users;

  return (
    <div className="max-w-5xl mr-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl sm:text-3xl font-extrabold font-display">
          Bond <span className="text-primary">Tester</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Analyze the deep, algorithmic nature of your friendship
        </p>
      </div>

      <Card className="mb-8 border-t-4 border-t-primary">
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name1">Your Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name1"
                    placeholder="Enter your name"
                    className="pl-10"
                    value={name1}
                    onChange={(e) => setName1(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name2">Friend's Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name2"
                    placeholder="Enter friend's name"
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
                <Users className="mr-2 h-4 w-4" /> Analyze Friendship
              </Button>
              <Button variant="outline" size="icon" onClick={reset}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {score !== null && result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Main Result Card */}
          <Card
            className={cn(
              "lg:col-span-2 relative overflow-hidden border-2",
              result.color.replace("text-", "border-").replace("500", "500/20"),
            )}
          >
            <div
              className={cn("absolute inset-0 opacity-20 blur-3xl", result.bg)}
            />

            <div className="absolute top-4 right-4 z-20">
              <Tooltip open={copied}>
                <TooltipTrigger asChild onClick={share}>
                  <Button
                    variant="outline"
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

            <CardContent className="text-center py-10 relative z-10 flex flex-col items-center">
              <div className={cn("p-4 rounded-full mb-6", result.bg)}>
                <ResultIcon className={cn("h-12 w-12", result.color)} />
              </div>

              <div className="text-6xl num mb-2 tracking-tighter">{score}%</div>

              <div className="w-full max-w-md mx-auto mb-6 ">
                <Progress
                  value={score}
                  className="h-2 bg-muted"
                  indicatorClassName={result.bg.replace("/10", "")}
                />
              </div>

              <div className="text-3xl mb-3">{result.emoji}</div>
              <CardTitle
                className={cn(
                  "text-3xl font-bold mb-4 uppercase tracking-wider font-display",
                  result.color,
                )}
              >
                {result.type}
              </CardTitle>

              <p className="text-lg text-muted-foreground max-w-md mb-6 leading-relaxed">
                {result.description}
              </p>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="h-full flex flex-col w-full">
            <CardHeader className="bg-muted/50 pb-4 border-b">
              <CardTitle className="text-lg flex font-display items-center gap-2">
                <span>📊</span> Bond Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex flex-col gap-6">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Key Traits
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.traits.map((trait) => (
                    <span
                      key={trait}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium border",
                        result.bg,
                        result.color
                          .replace("text-", "border-")
                          .replace("500", "500/30"),
                      )}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Suggested Activities
                </h4>
                <ul className="space-y-3">
                  {result.activities.map((act, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t mt-auto">
                <p className="text-xs text-muted-foreground text-center italic">
                  Between{" "}
                  <span className="font-semibold text-foreground">{name1}</span>{" "}
                  and{" "}
                  <span className="font-semibold text-foreground">{name2}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-8 bg-muted/30 p-4 rounded border">
        <h3 className="text-sm font-semibold mb-2">How the Algorithm Works</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The Bond Tester uses a sophisticated (and entirely fictional)
          cross-referencing hash function. It takes the specific character
          composition of both names, applies a friendship salt, and calculates a
          permanent resonance score. Different score brackets unlock distinct
          friendship archetypes, complete with behavioral traits and activity
          suggestions.
        </p>
      </div>
    </div>
  );
}
