"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, RefreshCcw, Check, Zap, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  NICKNAME_TEMPLATES,
  VIBES,
} from "@/data/tools/fun-tools/nickname-vibe";

export default function NicknameVibe() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [name, setName] = useState(searchParams.get("name") || "");
  const [selectedVibe, setSelectedVibe] = useState<string | null>(
    searchParams.get("vibe") || null,
  );
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateNicknames = useCallback((userName: string, vibeId: string) => {
    if (!userName || !vibeId) return [];

    const templates = NICKNAME_TEMPLATES[vibeId] || [];
    const formattedName =
      userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();

    // Deterministic selection based on name hash
    const nameHash = userName
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Sort templates based on nameHash to give variety but keep it deterministic
    return templates
      .map((t) => t.replace("[N]", formattedName))
      .sort(() => (nameHash % 3) - 1)
      .slice(0, 5);
  }, []);

  useEffect(() => {
    const n = searchParams.get("name");
    const v = searchParams.get("vibe");

    if (n && v) {
      setNicknames(generateNicknames(n, v));
    } else {
      setNicknames([]);
    }
  }, [searchParams, generateNicknames]);

  const handleGenerate = () => {
    if (name && selectedVibe) {
      const res = generateNicknames(name, selectedVibe);
      setNicknames(res);
      const params = new URLSearchParams(searchParams.toString());
      params.set("name", name);
      params.set("vibe", selectedVibe);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const reset = () => {
    setName("");
    setSelectedVibe(null);
    setNicknames([]);
    router.push(pathname, { scroll: false });
  };

  const copyNickname = (nick: string, index: number) => {
    navigator.clipboard.writeText(nick);
    setCopiedIndex(index);
    toast.success(`Copied "${nick}" to clipboard!`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const vibe = VIBES.find((v) => v.id === selectedVibe);

  return (
    <div className="max-w-5xl mr-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl sm:text-3xl font-extrabold font-display">
          Nickname <span className="text-primary">Generator</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Create unique and fun nicknames based on your vibe
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
              <Label>Select Your Vibe</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {VIBES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVibe(v.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all hover:bg-accent",
                      selectedVibe === v.id
                        ? "border-primary bg-primary/5 scale-105"
                        : "border-transparent bg-muted/50",
                    )}
                  >
                    <v.icon className={cn("h-6 w-6 mb-2", v.color)} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {v.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                onClick={handleGenerate}
                disabled={!name || !selectedVibe}
              >
                <Zap className="mr-2 h-4 w-4 fill-current" /> Generate Nicknames
              </Button>
              <Button variant="outline" size="icon" onClick={reset}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {nicknames.length > 0 && vibe && (
        <div className="grid gap-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <vibe.icon className={cn("h-4 w-4", vibe.color)} />
              {vibe.label} Results
            </h3>
          </div>

          <div className="grid gap-3">
            {nicknames.map((nick, idx) => (
              <Card
                key={idx}
                className="group hover:border-primary/50 transition-all overflow-hidden relative"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-lg font-bold font-display">{nick}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyNickname(nick, idx)}
                  >
                    {copiedIndex === idx ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-3">How it works</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The Nickname Generator uses your chosen vibe as a template engine. It
          applies specific naming conventions associated with that style to your
          name. The results are deterministic, meaning you'll get a consistent
          set of aliases every time you use the same name and vibe!
        </p>
      </div>
    </div>
  );
}
