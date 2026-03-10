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
  Target,
  RefreshCcw,
  Percent,
  GraduationCap,
  Award,
  History,
  Trash2,
  RotateCcw,
  Star,
  ListChecks,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FINAL_GRADE_CONTENT } from "@/data/tools/calculators/final-grade";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

export default function FinalGradeCalculator() {
  const { title, description, about, features, steps } = FINAL_GRADE_CONTENT;
  const [currentGrade, setCurrentGrade] = useState("85");
  const [targetGrade, setTargetGrade] = useState("90");
  const [finalWeight, setFinalWeight] = useState("20");

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/final-grade-calculator")
      .reverse()
      .limit(5)
      .toArray(),
  );

  const needed = useMemo(() => {
    const current = parseFloat(currentGrade);
    const target = parseFloat(targetGrade);
    const weight = parseFloat(finalWeight);

    if (isNaN(current) || isNaN(target) || isNaN(weight) || weight === 0)
      return null;

    const w = weight / 100;
    const res = (target - current * (1 - w)) / w;
    return res;
  }, [currentGrade, targetGrade, finalWeight]);

  const saveToHistory = async () => {
    if (needed === null) return;
    await db.history.add({
      toolUrl: "/final-grade-calculator",
      toolName: "Final Grade Calculator",
      input: { currentGrade, targetGrade, finalWeight },
      result: { neededScore: needed.toFixed(1) },
      timestamp: Date.now(),
    });
    toast.success("Result saved to history");
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history
      .where("toolUrl")
      .equals("/final-grade-calculator")
      .delete();
  };

  const reset = () => {
    setCurrentGrade("85");
    setTargetGrade("90");
    setFinalWeight("20");
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
              <CardTitle className="text-lg">Exam Details</CardTitle>
              <CardDescription>
                Enter your current progress and final exam weight
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="current">Current Grade (%)</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="current"
                      type="number"
                      className="pl-10"
                      value={currentGrade}
                      onChange={(e) => setCurrentGrade(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="target">Target Grade (%)</Label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="target"
                      type="number"
                      className="pl-10"
                      value={targetGrade}
                      onChange={(e) => setTargetGrade(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weight">Final Exam Weight (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="weight"
                    type="number"
                    className="pl-10"
                    value={finalWeight}
                    onChange={(e) => setFinalWeight(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={reset}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button onClick={saveToHistory} disabled={needed === null}>
                  Save Result
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Required Score Card for Mobile (hidden on Desktop) */}
          <div className="xl:hidden h-fit">
            <RequiredScoreCard needed={needed} />
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
                          {item.result.neededScore}% Needed
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Target {item.input.targetGrade}% (Weight{" "}
                          {item.input.finalWeight}%)
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
                            setCurrentGrade(item.input.currentGrade);
                            setTargetGrade(item.input.targetGrade);
                            setFinalWeight(item.input.finalWeight);
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
          </div>
        </div>

        {/* Required Score Card for Desktop (hidden on Mobile) */}
        <div className="hidden xl:block space-y-6 h-fit">
          <RequiredScoreCard needed={needed} />
        </div>
      </div>
    </div>
  );
}

function RequiredScoreCard({ needed }: { needed: number | null }) {
  return (
    <Card className="h-full border-t-4 border-t-primary overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg text-center">Required Score</CardTitle>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="text-center py-8 bg-muted/30 rounded-xl relative overflow-hidden">
          <Award className="absolute -right-4 -top-4 h-24 w-24 opacity-5 text-primary rotate-12" />
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-widest">
            You need a
          </p>
          <p
            className={cn(
              "text-6xl font-black",
              needed !== null && needed > 100
                ? "text-destructive"
                : "text-primary",
            )}
          >
            {needed !== null ? needed.toFixed(1) + "%" : "—"}
          </p>
        </div>

        {needed !== null && (
          <div className="space-y-4">
            {needed > 100 ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-xs font-medium leading-relaxed">
                ⚠️ You need more than 100% to reach your target. You might need
                to adjust your goals or ask for extra credit!
              </div>
            ) : needed < 0 ? (
              <div className="p-4 bg-green-500/10 text-green-600 rounded-lg text-xs font-medium leading-relaxed">
                🎉 You already reached your target! Even with a 0% on the final,
                you're good.
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed italic text-center">
                Good luck! You can do this.
              </p>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg text-left">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Final grade is calculated as (Target - (Current * (1 - Weight))) /
            Weight. It helps you focus your study efforts.
          </p>
        </div>
      </CardContent>
    </Card>
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
