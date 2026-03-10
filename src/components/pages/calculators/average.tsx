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
import { Label } from "@/components/ui/label";
import {
  Sigma,
  RefreshCcw,
  Copy,
  Hash,
  ArrowUp01,
  Equal,
  List,
  FormInput,
  Text,
  History,
  Trash2,
  RotateCcw,
  Star,
  ListChecks,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { AVERAGE_CONTENT } from "@/data/tools/calculators/average";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { cn } from "@/lib/utils";

export default function AverageCalculator() {
  const { title, description, about, features, steps } = AVERAGE_CONTENT;
  const [input, setInput] = useState("10, 20, 30, 40, 50");

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/average-calculator")
      .reverse()
      .limit(5)
      .toArray(),
  );

  const stats = useMemo(() => {
    const nums = input
      .split(/[,\s\n]+/)
      .map((n) => parseFloat(n.trim()))
      .filter((n) => !isNaN(n));

    if (nums.length === 0) return null;

    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / nums.length;

    // Median
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

    // Mode
    const counts: Record<number, number> = {};
    let maxCount = 0;
    nums.forEach((n) => {
      counts[n] = (counts[n] || 0) + 1;
      if (counts[n] > maxCount) maxCount = counts[n];
    });
    const modes = Object.keys(counts)
      .filter((k) => counts[parseFloat(k)] === maxCount)
      .map(Number);
    const mode = maxCount > 1 ? modes : "No unique mode";

    // Range
    const range = sorted[sorted.length - 1] - sorted[0];

    return {
      count: nums.length,
      sum,
      mean,
      median,
      mode: Array.isArray(mode) ? mode.join(", ") : mode,
      range,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }, [input]);

  const saveToHistory = async () => {
    if (!stats) return;
    await db.history.add({
      toolUrl: "/average-calculator",
      toolName: "Average Calculator",
      input: { data: input },
      result: stats,
      timestamp: Date.now(),
    });
    toast.success("Result saved to history");
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/average-calculator").delete();
  };

  const copyToClipboard = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toast.success(`Copied ${label}: ${val}`);
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
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Text className="h-5 w-5 text-primary" />
                Input Data
              </CardTitle>
              <CardDescription>
                Enter numbers separated by commas, spaces, or new lines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="data">Numbers</Label>
                <Textarea
                  id="data"
                  placeholder="e.g. 10, 20, 30..."
                  className="min-h-37.5 font-mono"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setInput("")}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button onClick={saveToHistory} disabled={!stats}>
                  Save Result
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard
              label="Mean (Average)"
              value={stats?.mean.toFixed(2)}
              icon={Sigma}
              onCopy={() =>
                copyToClipboard(stats?.mean.toFixed(2) || "", "Mean")
              }
            />
            <ResultCard
              label="Median"
              value={stats?.median.toString()}
              icon={Equal}
              onCopy={() =>
                copyToClipboard(stats?.median.toString() || "", "Median")
              }
            />
            <ResultCard
              label="Mode"
              value={stats?.mode.toString()}
              icon={Hash}
              onCopy={() =>
                copyToClipboard(stats?.mode.toString() || "", "Mode")
              }
            />
            <ResultCard
              label="Range"
              value={stats?.range.toString()}
              icon={ArrowUp01}
              onCopy={() =>
                copyToClipboard(stats?.range.toString() || "", "Range")
              }
            />
          </div>

          {/* Quick Summary for Mobile (hidden on Desktop) */}
          <div className="xl:hidden h-fit">
            <QuickSummary stats={stats} />
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
                          Mean: {item.result.mean.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-50">
                          {item.input.data}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          title="Restore"
                          onClick={() => {
                            setInput(item.input.data);
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
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

          <div className="space-y-6">
            <ToolInfo about={about} features={features} steps={steps} />

            <div className="mt-8">
              <h3 className="text-sm font-semibold mb-3">Definitions</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-xs text-muted-foreground leading-relaxed">
                <p>
                  <strong>Mean:</strong> The sum of all values divided by the
                  number of values.
                </p>
                <p>
                  <strong>Median:</strong> The middle value when the data set is
                  ordered from least to greatest.
                </p>
                <p>
                  <strong>Mode:</strong> The value that appears most frequently
                  in the data set.
                </p>
                <p>
                  <strong>Range:</strong> The difference between the highest and
                  lowest values.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary for Desktop (hidden on Mobile) */}
        <div className="hidden xl:block space-y-6 h-fit">
          <QuickSummary stats={stats} />
        </div>
      </div>
    </div>
  );
}

function QuickSummary({ stats }: { stats: any }) {
  return (
    <Card className="h-full border-t-4 border-t-primary overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg text-center">Quick Summary</CardTitle>
        <CardDescription className="text-center">
          Overall dataset statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <SummaryItem label="Count" value={stats?.count} />
        <SummaryItem label="Sum" value={stats?.sum} />
        <SummaryItem label="Minimum" value={stats?.min} />
        <SummaryItem label="Maximum" value={stats?.max} />
      </CardContent>
    </Card>
  );
}

// function ResultCard({ label, value, icon: Icon, onCopy }: { label: string, value?: string, icon: any, onCopy: () => void }) {
//   return (
//     <Card className="relative overflow-hidden group">
//       <CardContent className="p-4 flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <div className="p-2 rounded-lg bg-primary/10 text-primary">
//             <Icon className="h-4 w-4" />
//           </div>
//           <div>
//             <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
//             <p className="text-xl font-extrabold">{value ?? "—"}</p>
//           </div>
//         </div>
//         <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={onCopy}>
//           <Copy className="h-4 w-4" />
//         </Button>
//       </CardContent>
//     </Card>
//   );
// }

// function SummaryItem({ label, value }: { label: string, value?: any }) {
//   return (
//     <div className="flex justify-between items-center py-2 border-b last:border-0 border-muted/50">
//       <span className="text-sm text-muted-foreground">{label}</span>
//       <span className="font-bold">{value ?? "—"}</span>
//     </div>
//   );
// }

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

function ResultCard({
  label,
  value,
  icon: Icon,
  onCopy,
}: {
  label: string;
  value?: string;
  icon: any;
  onCopy: () => void;
}) {
  return (
    <Card className="relative overflow-hidden group">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {label}
            </p>
            <p className="text-xl font-extrabold">{value ?? "—"}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onCopy}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0 border-muted/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-bold">{value ?? "—"}</span>
    </div>
  );
}
