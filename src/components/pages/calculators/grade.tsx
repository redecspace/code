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
  Plus,
  Trash2,
  RefreshCcw,
  Target,
  BookOpen,
  History,
  RotateCcw,
  Star,
  ListChecks,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADE_CONTENT } from "@/data/tools/calculators/grade";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

interface Assignment {
  id: string;
  name: string;
  grade: string;
  weight: string;
}

export default function GradeCalculator() {
  const { title, description, about, features, steps } = GRADE_CONTENT;
  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: "1", name: "Assignments", grade: "90", weight: "20" },
    { id: "2", name: "Midterm", grade: "85", weight: "30" },
    { id: "3", name: "Final Exam", grade: "", weight: "50" },
  ]);

  const [targetGrade, setTargetGrade] = useState("90");

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/grade-calculator")
      .reverse()
      .limit(5)
      .toArray(),
  );

  const addAssignment = () => {
    setAssignments([
      ...assignments,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "",
        grade: "",
        weight: "",
      },
    ]);
  };

  const removeAssignment = (id: string) => {
    setAssignments(assignments.filter((a) => a.id !== id));
  };

  const updateAssignment = (
    id: string,
    field: keyof Assignment,
    value: string,
  ) => {
    setAssignments(
      assignments.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  };

  const stats = useMemo(() => {
    let currentGrade = 0;
    let totalWeight = 0;
    let gradedWeight = 0;

    assignments.forEach((a) => {
      const g = parseFloat(a.grade);
      const w = parseFloat(a.weight);
      if (!isNaN(w)) {
        totalWeight += w;
        if (!isNaN(g)) {
          currentGrade += (g * w) / 100;
          gradedWeight += w;
        }
      }
    });

    const average = gradedWeight > 0 ? (currentGrade / gradedWeight) * 100 : 0;
    const remainingWeight = totalWeight - gradedWeight;
    const target = parseFloat(targetGrade);

    let neededOnRemaining = null;
    if (!isNaN(target) && remainingWeight > 0) {
      neededOnRemaining = ((target - currentGrade) / remainingWeight) * 100;
    }

    return {
      currentGrade,
      gradedWeight,
      totalWeight,
      average,
      neededOnRemaining,
      remainingWeight,
    };
  }, [assignments, targetGrade]);

  const saveToHistory = async () => {
    await db.history.add({
      toolUrl: "/grade-calculator",
      toolName: "Grade Calculator",
      input: { assignments, targetGrade },
      result: stats,
      timestamp: Date.now(),
    });
    toast.success("Result saved to history");
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/grade-calculator").delete();
  };

  const reset = () => {
    setAssignments([
      { id: "1", name: "Assignments", grade: "90", weight: "20" },
      { id: "2", name: "Midterm", grade: "85", weight: "30" },
      { id: "3", name: "Final Exam", grade: "", weight: "50" },
    ]);
    setTargetGrade("90");
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Assignments
                </CardTitle>
                <CardDescription>
                  Add your course components and their weights
                </CardDescription>
              </div>
              <Button onClick={addAssignment} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Add Row
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 px-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  <div className="col-span-6">Name (Optional)</div>
                  <div className="col-span-3">Grade (%)</div>
                  <div className="col-span-2">Weight (%)</div>
                  <div className="col-span-1"></div>
                </div>
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="grid grid-cols-12 gap-2 sm:gap-4 items-center"
                  >
                    <div className="col-span-6">
                      <Input
                        placeholder="e.g. Midterm"
                        value={a.name}
                        onChange={(e) =>
                          updateAssignment(a.id, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="0-100"
                        value={a.grade}
                        onChange={(e) =>
                          updateAssignment(a.id, "grade", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="%"
                        value={a.weight}
                        onChange={(e) =>
                          updateAssignment(a.id, "weight", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeAssignment(a.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Target Grade
              </CardTitle>
              <CardDescription>
                What overall grade are you aiming for?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid items-center gap-4">
                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="target">Desired Grade (%)</Label>
                  <Input
                    id="target"
                    type="number"
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                  />
                </div>
                <div className="w-full">
                  {stats.neededOnRemaining !== null && (
                    <div className="p-4 bg-primary/5 rounded border border-primary/10">
                      <p className="text-xs font-bold uppercase text-primary mb-1">
                        Needed on remaining
                      </p>
                      <p className="text-2xl font-black">
                        {stats.neededOnRemaining.toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-8 flex gap-2 justify-end">
                <Button variant="outline" onClick={reset}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button onClick={saveToHistory}>Save Result</Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Card for Mobile (hidden on Desktop) */}
          <div className="xl:hidden h-fit">
            <GradeResultCard stats={stats} reset={reset} />
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
                          Avg: {item.result.average.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.input.assignments.length} assignments, Target{" "}
                          {item.input.targetGrade}%
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
                            setAssignments(item.input.assignments);
                            setTargetGrade(item.input.targetGrade);
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

        {/* Result Card for Desktop (hidden on Mobile) */}
        <div className="hidden xl:block h-fit space-y-6">
          <GradeResultCard stats={stats} reset={reset} />
        </div>
      </div>
    </div>
  );
}

function GradeResultCard({ stats, reset }: any) {
  return (
    <Card className="border-t-4 border-t-primary h-full flex flex-col overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg text-center">Overall Result</CardTitle>
      </CardHeader>
      <CardContent className="pt-8 flex flex-col gap-6">
        <div className="text-center py-6 bg-muted/30 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">
            Current Average
          </p>
          <p className="text-6xl font-black text-primary">
            {stats.average.toFixed(2)}%
          </p>
        </div>

        <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
          <SummaryItem label="Graded Weight" value={`${stats.gradedWeight}%`} />
          <SummaryItem
            label="Remaining Weight"
            value={`${stats.remainingWeight}%`}
          />
          <SummaryItem
            label="Total Weight"
            value={`${stats.totalWeight}%`}
            color={stats.totalWeight !== 100 ? "text-orange-500" : ""}
          />
        </div>

        {stats.totalWeight !== 100 && (
          <p className="text-[10px] text-orange-500 font-medium leading-tight">
            ⚠️ Your weights sum to {stats.totalWeight}%. For most classes, they
            should sum to 100%.
          </p>
        )}

        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg text-left">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Your grade is calculated as a weighted average. Each component's
            grade is multiplied by its weight and divided by 100.
          </p>
        </div>

        <Button variant="outline" className="w-full" onClick={reset}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Reset All
        </Button>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0 border-muted/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("font-bold", color)}>{value}</span>
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
