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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  RefreshCcw,
  School,
  History,
  RotateCcw,
  Star,
  ListChecks,
  Info,
} from "lucide-react";
import { GRADE_VALUES, GPA_CONTENT } from "@/data/tools/calculators/gpa";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

interface Course {
  id: string;
  name: string;
  grade: string;
  credits: string;
}

export default function GPACalculator() {
  const { title, description, about, features, steps } = GPA_CONTENT;
  const [courses, setCourses] = useState<Course[]>([
    { id: "1", name: "Course 1", grade: "A", credits: "3" },
    { id: "2", name: "Course 2", grade: "B+", credits: "4" },
    { id: "3", name: "Course 3", grade: "A-", credits: "3" },
  ]);

  const [priorGPA, setPriorGPA] = useState("");
  const [priorCredits, setPriorCredits] = useState("");

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/gpa-calculator")
      .reverse()
      .limit(5)
      .toArray(),
  );

  const addCourse = () => {
    setCourses([
      ...courses,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "",
        grade: "A",
        credits: "3",
      },
    ]);
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter((c) => c.id !== id));
  };

  const updateCourse = (id: string, field: keyof Course, value: string) => {
    setCourses(
      courses.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const gpaStats = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach((c) => {
      const gradeVal = GRADE_VALUES[c.grade];
      const creditsVal = parseFloat(c.credits);
      if (!isNaN(creditsVal)) {
        totalPoints += gradeVal * creditsVal;
        totalCredits += creditsVal;
      }
    });

    const semesterGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

    // Cumulative
    const pGPA = parseFloat(priorGPA);
    const pCredits = parseFloat(priorCredits);
    let cumulativeGPA = semesterGPA;
    let combinedCredits = totalCredits;

    if (!isNaN(pGPA) && !isNaN(pCredits)) {
      const priorPoints = pGPA * pCredits;
      cumulativeGPA = (priorPoints + totalPoints) / (pCredits + totalCredits);
      combinedCredits = pCredits + totalCredits;
    }

    return {
      semesterGPA,
      cumulativeGPA,
      totalCredits,
      combinedCredits,
    };
  }, [courses, priorGPA, priorCredits]);

  const saveToHistory = async () => {
    await db.history.add({
      toolUrl: "/gpa-calculator",
      toolName: "GPA Calculator",
      input: { courses, priorGPA, priorCredits },
      result: gpaStats,
      timestamp: Date.now(),
    });
    toast.success("Result saved to history");
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/gpa-calculator").delete();
  };

  const reset = () => {
    setCourses([
      { id: "1", name: "Course 1", grade: "A", credits: "3" },
      { id: "2", name: "Course 2", grade: "B+", credits: "4" },
    ]);
    setPriorGPA("");
    setPriorCredits("");
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <School className="h-5 w-5 text-primary" />
                  Current Semester
                </CardTitle>
              </div>
              <Button onClick={addCourse} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Add Course
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-12 gap-2 sm:gap-4 items-center"
                  >
                    <div className="col-span-5 sm:col-span-6">
                      <Input
                        placeholder="Course Name"
                        value={c.name}
                        onChange={(e) =>
                          updateCourse(c.id, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={c.grade}
                        onValueChange={(val) =>
                          updateCourse(c.id, "grade", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(GRADE_VALUES).map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <Input
                        type="number"
                        placeholder="Credits"
                        value={c.credits}
                        onChange={(e) =>
                          updateCourse(c.id, "credits", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCourse(c.id)}
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
              <CardTitle className="text-lg">
                Prior Cumulative GPA (Optional)
              </CardTitle>
              <CardDescription>
                Include your previous records for cumulative calculation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label>Prior GPA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={priorGPA}
                    onChange={(e) => setPriorGPA(e.target.value)}
                    placeholder="e.g. 3.50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Prior Credits</Label>
                  <Input
                    type="number"
                    value={priorCredits}
                    onChange={(e) => setPriorCredits(e.target.value)}
                    placeholder="e.g. 60"
                  />
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
            <GPAResultCard
              gpaStats={gpaStats}
              priorGPA={priorGPA}
              priorCredits={priorCredits}
              reset={reset}
            />
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
                          GPA: {item.result.semesterGPA.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.input.courses.length} courses
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
                            setCourses(item.input.courses);
                            setPriorGPA(item.input.priorGPA);
                            setPriorCredits(item.input.priorCredits);
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
        <div className="hidden xl:block space-y-6 h-fit">
          <GPAResultCard
            gpaStats={gpaStats}
            priorGPA={priorGPA}
            priorCredits={priorCredits}
            reset={reset}
          />
        </div>
      </div>
    </div>
  );
}

function GPAResultCard({ gpaStats, priorGPA, priorCredits, reset }: any) {
  return (
    <Card className="h-full border-t-4 border-t-primary overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg text-center">GPA Results</CardTitle>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="text-center">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">
            Semester GPA
          </p>
          <p className="text-7xl font-black text-primary">
            {gpaStats.semesterGPA.toFixed(2)}
          </p>
        </div>

        {priorGPA && (
          <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-[10px] uppercase font-bold text-primary mb-1 tracking-widest">
              Cumulative GPA
            </p>
            <p className="text-4xl font-black">
              {gpaStats.cumulativeGPA.toFixed(2)}
            </p>
          </div>
        )}

        <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Semester Credits:</span>
            <span className="font-bold">{gpaStats.totalCredits}</span>
          </div>
          {priorCredits && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Credits:</span>
              <span className="font-bold">{gpaStats.combinedCredits}</span>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg text-left">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            GPA is calculated by dividing total grade points by total credit
            hours. A higher credit weight for a course impacts the GPA more
            significantly.
          </p>
        </div>

        <Button variant="outline" className="w-full" onClick={reset}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Reset All
        </Button>
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
