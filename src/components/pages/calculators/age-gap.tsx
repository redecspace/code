"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCcw,
  User,
  Users,
  Info,
  Heart,
  Calendar,
  ArrowRight,
  Share2,
  Check,
  AlertCircle,
  History,
  Trash2,
  RotateCcw,
  Star,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  differenceInDays,
  differenceInYears,
  intervalToDuration,
  parseISO,
  isValid,
  addYears,
  format,
  isAfter,
} from "date-fns";
import { AGE_GAP_CONTENT } from "@/data/tools/calculators/age-gap";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

export default function AgeGapCalculator() {
  const { title, description, about, features, steps } = AGE_GAP_CONTENT;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize state from URL or defaults
  const [mode, setMode] = useState(
    searchParams.get("m") === "age" ? "age" : "dob",
  );
  const [dob1, setDob1] = useState(searchParams.get("d1") || "1995-01-01");
  const [dob2, setDob2] = useState(searchParams.get("d2") || "2000-01-01");
  const [age1, setAge1] = useState(searchParams.get("a1") || "30");
  const [age2, setAge2] = useState(searchParams.get("a2") || "25");

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/age-gap-calculator")
      .reverse()
      .limit(5)
      .toArray(),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const results = useMemo(() => {
    const now = new Date();

    if (mode === "dob") {
      const d1 = parseISO(dob1);
      const d2 = parseISO(dob2);
      if (!isValid(d1) || !isValid(d2)) return null;

      const isFuture1 = isAfter(d1, now);
      const isFuture2 = isAfter(d2, now);
      if (isFuture1 || isFuture2) {
        return { error: "Birth dates cannot be in the future" };
      }

      const olderDate = d1 < d2 ? d1 : d2;
      const youngerDate = d1 < d2 ? d2 : d1;

      const duration = intervalToDuration({
        start: olderDate,
        end: youngerDate,
      });

      const years = duration.years || 0;
      const months = duration.months || 0;
      const days = duration.days || 0;
      const totalDays = Math.abs(differenceInDays(d1, d2));

      const age1Now = differenceInYears(now, d1);
      const age2Now = differenceInYears(now, d2);

      const minAge = Math.min(age1Now, age2Now);
      const maxAge = Math.max(age1Now, age2Now);
      const ratio = minAge > 0 ? maxAge / minAge : maxAge || 1;

      const ruleCheck = checkRule(age1Now, age2Now);
      let futureAcceptance = null;

      if (!ruleCheck) {
        const older = maxAge;
        const younger = minAge;
        const yearsToWait = older - 2 * younger + 14;
        if (yearsToWait > 0) {
          const acceptanceDate = addYears(now, yearsToWait);
          futureAcceptance = {
            years: yearsToWait,
            date: format(acceptanceDate, "yyyy"),
          };
        }
      }

      return {
        years,
        months,
        days,
        totalDays,
        older: d1 < d2 ? "Person 1" : "Person 2",
        age1: age1Now,
        age2: age2Now,
        ratio,
        ruleCheck,
        futureAcceptance,
      };
    } else {
      const a1 = parseFloat(age1);
      const a2 = parseFloat(age2);
      if (isNaN(a1) || isNaN(a2)) return null;

      const olderAge = Math.max(a1, a2);
      const youngerAge = Math.min(a1, a2);
      const ratio = youngerAge > 0 ? olderAge / youngerAge : olderAge || 1;
      const ruleCheck = checkRule(a1, a2);
      let futureAcceptance = null;

      if (!ruleCheck) {
        const yearsToWait = olderAge - 2 * youngerAge + 14;
        if (yearsToWait > 0) {
          futureAcceptance = {
            years: Math.ceil(yearsToWait),
            date: (
              new Date().getFullYear() + Math.ceil(yearsToWait)
            ).toString(),
          };
        }
      }

      return {
        years: Math.abs(a1 - a2),
        months: 0,
        days: 0,
        totalDays: Math.abs(a1 - a2) * 365.25,
        older: a1 > a2 ? "Person 1" : "Person 2",
        age1: a1,
        age2: a2,
        ratio,
        ruleCheck,
        futureAcceptance,
      };
    }
  }, [mode, dob1, dob2, age1, age2]);

  function checkRule(a1: number, a2: number) {
    const older = Math.max(a1, a2);
    const younger = Math.min(a1, a2);
    const minAge = older / 2 + 7;
    return younger >= minAge;
  }

  const saveToHistory = async () => {
    if (!results || results.error) return;
    await db.history.add({
      toolUrl: "/age-gap-calculator",
      toolName: "Age Gap Calculator",
      input: mode === "dob" ? { mode, dob1, dob2 } : { mode, age1, age2 },
      result: results,
      timestamp: Date.now(),
    });
    toast.success("Result saved to history");
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/age-gap-calculator").delete();
  };

  const handleShare = () => {
    const params = new URLSearchParams();
    params.set("m", mode);
    if (mode === "dob") {
      params.set("d1", dob1);
      params.set("d2", dob2);
    } else {
      params.set("a1", age1);
      params.set("a2", age2);
    }

    const url = `${window.location.origin}${pathname}?${params.toString()}`;

    if (navigator.share) {
      navigator
        .share({
          title: "Age Gap Result",
          text: `Check out this age gap calculation!`,
          url: url,
        })
        .catch(() => copyToClipboard(url));
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

  const reset = () => {
    setDob1("1995-01-01");
    setDob2("2000-01-01");
    setAge1("30");
    setAge2("25");
    router.push(pathname, { scroll: false });
  };

  const today = format(new Date(), "yyyy-MM-dd");

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mr-auto animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold font-display">
            {title.split(" ")[0]}{" "}
            <span className="text-primary">
              {title.split(" ").slice(1).join(" ")}
            </span>
          </h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>
        {results && !results.error && (
          <TooltipProvider>
            <Tooltip open={copied}>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="sm:mb-1 gap-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  Share Result
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Link Copied!</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Input Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={mode}
                onValueChange={(v) => setMode(v)}
                className="w-full"
              >
                <div className="w-full overflow-x-auto">
                  <TabsList className="flex gap-1 mb-8">
                    <TabsTrigger value="dob">Date of Birth</TabsTrigger>
                    <TabsTrigger value="age">Current Ages</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="dob" className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <Label>Person 1 DOB</Label>
                      <Input
                        type="date"
                        max={today}
                        value={dob1}
                        onChange={(e) => setDob1(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Person 2 DOB</Label>
                      <Input
                        type="date"
                        max={today}
                        value={dob2}
                        onChange={(e) => setDob2(e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="age" className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <Label>Person 1 Age</Label>
                      <Input
                        type="number"
                        min="0"
                        value={age1}
                        onChange={(e) => setAge1(e.target.value)}
                        placeholder="e.g. 30"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Person 2 Age</Label>
                      <Input
                        type="number"
                        min="0"
                        value={age2}
                        onChange={(e) => setAge2(e.target.value)}
                        placeholder="e.g. 25"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-8 flex justify-end gap-2">
                <Button variant="outline" onClick={reset}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button
                  onClick={saveToHistory}
                  disabled={!results || !!results.error}
                >
                  Save Result
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Card for Mobile (hidden on Desktop) */}
          <div className="xl:hidden h-fit">
            <ResultCard results={results} />
          </div>

          {/* Visual Comparison */}
          {results && !results.error && (
            <Card className="animate-in zoom-in-95 duration-300">
              <CardHeader>
                <CardTitle className="text-lg">Visual Comparison</CardTitle>
              </CardHeader>
              <CardContent className="py-10">
                <div className="flex flex-col gap-10">
                  <div className="flex items-center justify-between gap-4 max-w-md mx-auto w-full">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          "rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 transition-all",
                          (results.age1 ?? 0) > (results.age2 ?? 0)
                            ? "h-20 w-20"
                            : "h-16 w-16",
                        )}
                      >
                        <User
                          className={cn(
                            "text-primary",
                            (results.age1 ?? 0) > (results.age2 ?? 0)
                              ? "h-10 w-10"
                              : "h-8 w-8",
                          )}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Person 1
                        </p>
                        <p className="text-sm font-black text-primary">
                          {results.age1}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      <div className="h-px w-full bg-muted-foreground/20 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 py-1 border rounded-full text-[10px] font-bold whitespace-nowrap num">
                          {results.years}Y {results.months}M {results.days}D
                        </div>
                      </div>
                      <p className="mt-4 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                        Difference
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          "rounded-full bg-secondary/10 flex items-center justify-center border-2 border-secondary/20 transition-all",
                          (results.age2 ?? 0) > (results.age1 ?? 0)
                            ? "h-20 w-20"
                            : "h-16 w-16",
                        )}
                      >
                        <User
                          className={cn(
                            "text-secondary",
                            (results.age2 ?? 0) > (results.age1 ?? 0)
                              ? "h-10 w-10"
                              : "h-8 w-8",
                          )}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Person 2
                        </p>
                        <p className="text-sm font-black text-secondary">
                          {" "}
                          {results.age2}
                        </p>
                      </div>
                    </div>
                  </div>

                  {results.futureAcceptance && (
                    <div className="max-w-xs mx-auto w-full">
                      <div className="flex items-center gap-2 mb-2 justify-center">
                        <div className="h-px flex-1 bg-blue-500/20" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                          Growth Path
                        </span>
                        <div className="h-px flex-1 bg-blue-500/20" />
                      </div>
                      <div className="flex items-center justify-center gap-4 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10 border-dashed">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            Now
                          </p>
                          <p className="text-xs font-bold text-orange-500">
                            Outside
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-blue-400" />
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            In {results.futureAcceptance.years}Y
                          </p>
                          <p className="text-xs font-bold text-green-500">
                            Accepted
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {results?.error && (
            <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-4 items-center animate-pulse">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {results.error}
              </p>
            </div>
          )}

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
                          {item.result.years} Years
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.input.mode === "dob"
                            ? `${item.input.dob1} vs ${item.input.dob2}`
                            : `Age ${item.input.age1} vs ${item.input.age2}`}
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
                            setMode(item.input.mode);
                            if (item.input.mode === "dob") {
                              setDob1(item.input.dob1);
                              setDob2(item.input.dob2);
                            } else {
                              setAge1(item.input.age1);
                              setAge2(item.input.age2);
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

          <div className="space-y-6">
            <ToolInfo about={about} features={features} steps={steps} />

            <div className="bg-muted/30 p-6 rounded border">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                The "Half Your Age Plus Seven" Rule
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This rule is a common social guideline used to determine the
                minimum age of a person one could date without it being
                considered "creepy" or socially inappropriate. The formula is:{" "}
                <strong>(Older Age / 2) + 7 = Minimum Younger Age</strong>. For
                example, a 30-year-old's minimum partner age would be 22.
              </p>
            </div>
          </div>
        </div>

        {/* Result Card for Desktop (hidden on Mobile) */}
        <div className="hidden xl:block space-y-6 h-fit">
          <ResultCard results={results} />
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

function ResultCard({ results }: { results: any }) {
  return (
    <Card className="flex flex-col gap-4 h-full border-t-4 border-t-primary ">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg">Result Insights</CardTitle>
      </CardHeader>
      <CardContent className="pt-8 flex flex-col gap-6 h-full">
        {!results || results.error ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Info className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-xs">Waiting for valid input...</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-6xl font-black text-primary num">
                {results.years}
              </p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2 tracking-widest">
                Years Difference
              </p>
            </div>

            <div className="space-y-4">
              <SummaryItem label="Older Person" value={results.older} />
              <SummaryItem
                label="Total Days"
                value={results.totalDays?.toLocaleString() ?? "0"}
              />
              <SummaryItem
                label="Age Ratio"
                value={`${results.ratio?.toFixed(2) ?? "1.00"}x`}
              />
            </div>

            <div className="flex-1 flex flex-col justify-end gap-4">
              {results.futureAcceptance && (
                <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/20 flex gap-3">
                  <Calendar className="h-5 w-5 shrink-0 text-blue-500" />
                  <div>
                    <p className="text-xs font-bold uppercase mb-1">
                      Future Acceptance
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      This gap will meet the standard rule in
                      <span className="font-bold mx-1 text-blue-600">
                        {results.futureAcceptance.years} years
                      </span>
                      (around year {results.futureAcceptance.date}).
                    </p>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "p-4 rounded-xl border flex gap-3",
                  results.ruleCheck
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-orange-500/5 border-orange-500/20",
                )}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 shrink-0",
                    results.ruleCheck ? "text-green-500" : "text-orange-500",
                  )}
                />
                <div>
                  <p className="text-xs font-bold uppercase mb-1">
                    Standard Rule
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    According to the "Half your age plus seven" rule, this gap
                    is
                    <span
                      className={cn(
                        "font-bold mx-1",
                        results.ruleCheck
                          ? "text-green-600"
                          : "text-orange-600",
                      )}
                    >
                      {results.ruleCheck
                        ? "Socially Accepted."
                        : "Outside Standard."}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0 border-muted/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-bold">{value ?? "—"}</span>
    </div>
  );
}
