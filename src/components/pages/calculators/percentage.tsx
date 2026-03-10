"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Percent,
  RefreshCcw,
  Copy,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  History,
  Trash2,
  RotateCcw,
  Info,
  Star,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PERCENTAGE_CONTENT } from "@/data/tools/calculators/percentage";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

export default function PercentageCalculator() {
  const { title, description, about, features, steps } = PERCENTAGE_CONTENT;

  // 1. What is P% of V?
  const [p1, setP1] = useState("10");
  const [v1, setV1] = useState("100");
  const r1 = useMemo(() => (parseFloat(p1) / 100) * parseFloat(v1), [p1, v1]);

  // 2. V1 is what % of V2?
  const [v2_1, setV21] = useState("20");
  const [v2_2, setV22] = useState("100");
  const r2 = useMemo(
    () => (parseFloat(v2_1) / parseFloat(v2_2)) * 100,
    [v2_1, v2_2],
  );

  // 3. What is the % increase/decrease from V1 to V2?
  const [v3_1, setV31] = useState("100");
  const [v3_2, setV32] = useState("120");
  const r3 = useMemo(
    () => ((parseFloat(v3_2) - parseFloat(v3_1)) / parseFloat(v3_1)) * 100,
    [v3_1, v3_2],
  );

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/percentage-calculator")
      .reverse()
      .limit(5)
      .toArray(),
  );

  const saveToHistory = async (type: string, input: any, result: any) => {
    await db.history.add({
      toolUrl: "/percentage-calculator",
      toolName: `Percentage (${type})`,
      input,
      result,
      timestamp: Date.now(),
    });
    toast.success("Result saved to history");
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/percentage-calculator").delete();
  };

  const reset = () => {
    setP1("10");
    setV1("100");
    setV21("20");
    setV22("100");
    setV31("100");
    setV32("120");
  };

  const copyToClipboard = (val: string) => {
    navigator.clipboard.writeText(val);
    toast.success(`Copied ${val} to clipboard!`);
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
          <div className="space-y-6">
            {/* Tool 1: P% of V */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  Percentage of a value
                </CardTitle>
                <CardDescription>What is X% of Y?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-end gap-4">
                  <div className="grid gap-2 w-full sm:w-32">
                    <Label>Percentage (%)</Label>
                    <Input
                      type="number"
                      value={p1}
                      onChange={(e) => setP1(e.target.value)}
                    />
                  </div>
                  <span className="mb-2.5 font-medium hidden sm:block text-muted-foreground">
                    of
                  </span>
                  <div className="grid gap-2 w-full sm:flex-1">
                    <Label>Value</Label>
                    <Input
                      type="number"
                      value={v1}
                      onChange={(e) => setV1(e.target.value)}
                    />
                  </div>
                  <ArrowRight className="mb-2.5 h-5 w-5 text-muted-foreground hidden sm:block" />
                  <div className="grid gap-2 w-full sm:flex-1">
                    <Label>Result</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={isNaN(r1) ? "" : r1.toFixed(2)}
                        className="bg-muted/50 font-bold text-primary"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(r1.toString())}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => saveToHistory("Value", { p1, v1 }, { r1 })}
                  >
                    Save Result
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tool 2: V1 is what % of V2 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Percentage ratio
                </CardTitle>
                <CardDescription>X is what percentage of Y?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-end gap-4">
                  <div className="grid gap-2 w-full sm:flex-1">
                    <Label>Value 1</Label>
                    <Input
                      type="number"
                      value={v2_1}
                      onChange={(e) => setV21(e.target.value)}
                    />
                  </div>
                  <span className="mb-2.5 font-medium hidden sm:block text-muted-foreground">
                    is what % of
                  </span>
                  <div className="grid gap-2 w-full sm:flex-1">
                    <Label>Value 2</Label>
                    <Input
                      type="number"
                      value={v2_2}
                      onChange={(e) => setV22(e.target.value)}
                    />
                  </div>
                  <ArrowRight className="mb-2.5 h-5 w-5 text-muted-foreground hidden sm:block" />
                  <div className="grid gap-2 w-full sm:flex-1">
                    <Label>Result (%)</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={isNaN(r2) ? "" : r2.toFixed(2) + "%"}
                        className="bg-muted/50 font-bold text-primary"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(r2.toString() + "%")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() =>
                      saveToHistory("Ratio", { v2_1, v2_2 }, { r2 })
                    }
                  >
                    Save Result
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tool 3: % Increase/Decrease */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Percentage Change
                </CardTitle>
                <CardDescription>
                  What is the percentage increase or decrease from X to Y?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-end gap-4">
                  <div className="grid gap-2 w-full sm:flex-1">
                    <Label>From</Label>
                    <Input
                      type="number"
                      value={v3_1}
                      onChange={(e) => setV31(e.target.value)}
                    />
                  </div>
                  <span className="mb-2.5 font-medium hidden sm:block text-muted-foreground">
                    to
                  </span>
                  <div className="grid gap-2 w-full sm:flex-1">
                    <Label>To</Label>
                    <Input
                      type="number"
                      value={v3_2}
                      onChange={(e) => setV32(e.target.value)}
                    />
                  </div>
                  <ArrowRight className="mb-2.5 h-5 w-5 text-muted-foreground hidden sm:block" />
                  <div className="grid gap-2 w-full sm:flex-1">
                    <Label>Result (%)</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={
                          isNaN(r3)
                            ? ""
                            : (r3 > 0 ? "+" : "") + r3.toFixed(2) + "%"
                        }
                        className={cn(
                          "bg-muted/50 font-bold",
                          r3 > 0
                            ? "text-green-500"
                            : r3 < 0
                              ? "text-red-500"
                              : "text-primary",
                        )}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(r3.toString() + "%")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() =>
                      saveToHistory("Change", { v3_1, v3_2 }, { r3 })
                    }
                  >
                    Save Result
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button variant="outline" onClick={reset}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Reset All
              </Button>
            </div>
          </div>

          {/* Results for Mobile (hidden on Desktop) */}
          <div className="xl:hidden h-fit">
            <SummaryCard r1={r1} r2={r2} r3={r3} />
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
                          {item.toolName.includes("Value") &&
                            item.result.r1?.toFixed(2)}
                          {item.toolName.includes("Ratio") &&
                            item.result.r2?.toFixed(2) + "%"}
                          {item.toolName.includes("Change") &&
                            (item.result.r3 > 0 ? "+" : "") +
                              item.result.r3?.toFixed(2) +
                              "%"}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {item.toolName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2 hidden sm:block">
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
                            if (item.toolName.includes("Value")) {
                              setP1(item.input.p1);
                              setV1(item.input.v1);
                            } else if (item.toolName.includes("Ratio")) {
                              setV21(item.input.v2_1);
                              setV22(item.input.v2_2);
                            } else if (item.toolName.includes("Change")) {
                              setV31(item.input.v3_1);
                              setV32(item.input.v3_2);
                            }
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

          {/* Tool Info for all */}
          <div className="space-y-6">
            <ToolInfo about={about} features={features} steps={steps} />
          </div>
        </div>

        <div className="hidden xl:block space-y-6 h-fit">
          <SummaryCard r1={r1} r2={r2} r3={r3} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ r1, r2, r3 }: { r1: number; r2: number; r3: number }) {
  return (
    <Card className="h-full border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle className="text-lg">Results Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SummaryItem label="Of Value" value={isNaN(r1) ? "—" : r1.toFixed(2)} />
        <SummaryItem
          label="Ratio"
          value={isNaN(r2) ? "—" : r2.toFixed(2) + "%"}
        />
        <SummaryItem
          label="Change"
          value={isNaN(r3) ? "—" : (r3 > 0 ? "+" : "") + r3.toFixed(2) + "%"}
          className={r3 > 0 ? "text-green-500" : r3 < 0 ? "text-red-500" : ""}
        />
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0 border-muted/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("font-bold", className)}>{value}</span>
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
