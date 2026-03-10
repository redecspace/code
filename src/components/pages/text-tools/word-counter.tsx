"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Copy,
  Check,
  History,
  Info,
  Star,
  ListChecks,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WORD_COUNTER_CONTENT } from "@/data/tools/text-tools/word-counter";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

function fleschScore(text: string) {
  const sentences =
    text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length || 1;
  const syllables = words.reduce((acc, word) => {
    let count =
      word
        .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
        .replace(/^y/, "")
        .match(/[aeiouy]{1,2}/g)?.length || 1;
    return acc + count;
  }, 0);
  return (
    206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount)
  );
}

function readabilityLabel(score: number) {
  if (score >= 90) return "Very Easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly Easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly Difficult";
  if (score >= 30) return "Difficult";
  return "Very Difficult";
}

export default function WordCounter() {
  const { title, description, about, features, steps } = WORD_COUNTER_CONTENT;
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/word-counter")
      .reverse()
      .limit(5)
      .toArray(),
  );

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const sentences = trimmed
      ? trimmed.split(/[.!?]+/).filter((s) => s.trim()).length
      : 0;
    const paragraphs = trimmed
      ? trimmed.split(/\n\n+/).filter((p) => p.trim()).length
      : 0;
    const readingTime = Math.ceil(words / 200);
    const flesch = trimmed ? Math.round(fleschScore(trimmed)) : 0;
    return {
      words,
      chars,
      charsNoSpaces,
      sentences,
      paragraphs,
      readingTime,
      flesch,
    };
  }, [text]);

  const saveToHistory = async () => {
    if (!text.trim()) return;
    await db.history.add({
      toolUrl: "/word-counter",
      toolName: "Word Counter",
      input: { preview: text.slice(0, 50) + (text.length > 50 ? "..." : "") },
      result: stats,
      timestamp: Date.now(),
    });
    toast.success("Stats saved to history");
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/word-counter").delete();
  };

  const copy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mr-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl sm:text-3xl font-extrabold font-display">
          {title.split(" ")[0]}{" "}
          <span className="text-primary">
            {title.split(" ").slice(1).join(" ")}
          </span>
        </h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                Text Input
              </CardTitle>
              <div className="flex gap-2">
                <Tooltip open={copied}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copy}
                      disabled={!text}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Copy Text</TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setText("");
                    setCopied(false);
                  }}
                  disabled={!text}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste or type your text here…"
                className="min-h-60 text-base resize-y"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setCopied(false);
                }}
              />
              <div className="flex justify-end gap-2">
                <Button onClick={saveToHistory} disabled={!text.trim()}>
                  Save Stats
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats for Mobile */}
          <div className="xl:hidden">
            <StatsSummary stats={stats} />
          </div>

          {history && history.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Recent History
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
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border group"
                    >
                      <div>
                        <p className="font-bold text-lg">
                          {item.result.words} words
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-50 sm:max-w-xs italic">
                          "{item.input.preview}"
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2 hidden sm:block">
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
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

          <div className="space-y-6">
            <ToolInfo about={about} features={features} steps={steps} />
          </div>
        </div>

        <div className="hidden xl:block space-y-6 h-fit">
          <StatsSummary stats={stats} />
        </div>
      </div>
    </div>
  );
}

function StatsSummary({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-lg">Detailed Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatItem label="Words" value={stats.words} />
          <StatItem label="Characters" value={stats.chars} />
          <StatItem label="No Spaces" value={stats.charsNoSpaces} />
          <StatItem label="Sentences" value={stats.sentences} />
          <StatItem label="Paragraphs" value={stats.paragraphs} />
          <StatItem label="Reading Time" value={`${stats.readingTime} min`} />
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Readability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black font-display text-primary">
              {stats.flesch}
            </div>
            <div>
              <p className="font-bold text-sm uppercase tracking-wider">
                {readabilityLabel(stats.flesch)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Flesch Reading Ease
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0 border-muted/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function ToolInfo({
  about,
  features,
  steps,
}: {
  about: string[];
  features: any[];
  steps: any[];
}) {
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
            <p
              key={i}
              className="text-sm text-muted-foreground leading-relaxed"
            >
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
                  <p className="text-sm font-bold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.description}
                  </p>
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
                <span className="text-xl font-black text-muted-foreground/80 leading-none">
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-bold">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
