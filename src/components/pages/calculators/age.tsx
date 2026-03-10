"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Calendar as CalendarIcon,
  RefreshCcw,
  Cake,
  Clock,
  History,
  Timer,
  Trash2,
  RotateCcw,
  Info,
  Star,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AGE_CONTENT } from "@/data/tools/calculators/age";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

export default function AgeCalculator() {
  const { title, description, about, features, steps } = AGE_CONTENT;
  const [birthDate, setBirthDate] = useState("2000-01-01");
  const [targetDate, setTargetDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/age-calculator")
      .reverse()
      .limit(5)
      .toArray(),
  );

  const ageData = useMemo(() => {
    const birth = new Date(birthDate);
    const target = new Date(targetDate);

    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null;

    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    let days = target.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const totalDays = Math.floor(
      (target.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;

    return {
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      totalHours,
      totalMinutes,
      nextBirthday: getNextBirthday(birth, target),
    };
  }, [birthDate, targetDate]);

  function getNextBirthday(birth: Date, target: Date) {
    const next = new Date(
      target.getFullYear(),
      birth.getMonth(),
      birth.getDate(),
    );
    if (next < target) next.setFullYear(target.getFullYear() + 1);

    const diff = next.getTime() - target.getTime();
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const m = Math.floor(d / 30.44); // Rough month
    return { months: m, days: d % 30 };
  }

  const saveToHistory = async () => {
    if (!ageData) return;
    await db.history.add({
      toolUrl: "/age-calculator",
      toolName: "Age Calculator",
      input: { birthDate, targetDate },
      result: ageData,
      timestamp: Date.now(),
    });
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/age-calculator").delete();
  };

  const reset = () => {
    setBirthDate("2000-01-01");
    setTargetDate(new Date().toISOString().split("T")[0]);
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
                <CalendarIcon className="h-5 w-5 text-primary" />
                Date Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 flex-wrap w-full">
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="birth">Date of Birth</Label>
                <input
                  id="birth"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="target">Age at the Date of</Label>
                <input
                  id="target"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
              <Button onClick={saveToHistory} disabled={!ageData}>
                Save Result
              </Button>
            </div>
          </Card>

          {ageData && (
            <div className="grid xs:grid-cols-3 gap-4 overflow-x-auto  w-full ">
              <StatCard
                label="Years"
                value={ageData.years}
                icon={History}
                color="text-blue-500"
              />
              <StatCard
                label="Months"
                value={ageData.months}
                icon={Clock}
                color="text-purple-500"
              />
              <StatCard
                label="Days"
                value={ageData.days}
                icon={Timer}
                color="text-orange-500"
              />
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cake className="h-5 w-5 text-primary" />
                Next Birthday
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {ageData?.nextBirthday.months} months and{" "}
                {ageData?.nextBirthday.days} days remaining
              </p>
            </CardContent>
          </Card>

          {/* Totals for Mobile (hidden on Desktop) */}
          <div className="xl:hidden h-fit">
            <TotalsCard ageData={ageData} />
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
                          {item.result.years}y {item.result.months}m{" "}
                          {item.result.days}d
                        </p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {item.input.birthDate} to {item.input.targetDate}
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
                            setBirthDate(item.input.birthDate);
                            setTargetDate(item.input.targetDate);
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

          {/* Tool Info for all*/}
          <div className="space-y-6 ">
            <ToolInfo about={about} features={features} steps={steps} />
          </div>
        </div>

        <div className="hidden xl:block space-y-6 h-fit">
          <TotalsCard ageData={ageData} />
        </div>
      </div>
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

function TotalsCard({ ageData }: { ageData: any }) {
  return (
    <Card className="h-full border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle className="text-lg">Total Values</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TotalItem
          label="Total Weeks"
          value={ageData?.totalWeeks.toLocaleString()}
        />
        <TotalItem
          label="Total Days"
          value={ageData?.totalDays.toLocaleString()}
        />
        <TotalItem
          label="Total Hours"
          value={ageData?.totalHours.toLocaleString()}
        />
        <TotalItem
          label="Total Minutes"
          value={ageData?.totalMinutes.toLocaleString()}
        />
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <Card className="relative w-full min-w-fit overflow-hidden border-b-4 border-b-muted hover:border-b-primary transition-all">
      <CardContent className="p-6 text-center">
        <Icon
          className={cn(
            "h-8 w-8 mx-auto mb-3 opacity-20 absolute -right-2 -top-2 scale-150 rotate-12",
            color,
          )}
        />
        <p className="text-4xl font-black mb-1">{value}</p>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

function TotalItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0 border-muted/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-bold">{value ?? "—"}</span>
    </div>
  );
}
