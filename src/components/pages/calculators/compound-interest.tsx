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
  RefreshCcw,
  Wallet,
  Calendar,
  Percent,
  History,
  Trash2,
  RotateCcw,
  Star,
  ListChecks,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPOUND_INTEREST_CONTENT } from "@/data/tools/calculators/compound-interest";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

export default function CompoundInterestCalculator() {
  const { title, description, about, features, steps } =
    COMPOUND_INTEREST_CONTENT;
  const [initialAmount, setInitialInvestment] = useState("5000");
  const [monthlyContribution, setMonthlyContribution] = useState("100");
  const [years, setYears] = useState("10");
  const [interestRate, setInterestRate] = useState("7");
  const [compoundFrequency, setCompoundFrequency] = useState("12");

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/compound-interest-calculator")
      .reverse()
      .limit(5)
      .toArray(),
  );

  const results = useMemo(() => {
    const P = parseFloat(initialAmount);
    const PMT = parseFloat(monthlyContribution);
    const t = parseFloat(years);
    const r = parseFloat(interestRate) / 100;
    const n = parseInt(compoundFrequency);

    if (isNaN(P) || isNaN(PMT) || isNaN(t) || isNaN(r) || isNaN(n)) return null;

    // A = P(1 + r/n)^(nt) + PMT * (((1 + r/n)^(nt) - 1) / (r/n))
    const nt = n * t;
    const rn = r / n;
    const compoundFactor = Math.pow(1 + rn, nt);

    const principalFutureValue = P * compoundFactor;
    const contributionsFutureValue = PMT * ((compoundFactor - 1) / rn);

    // Adjust for monthly contribution compounding (rough estimate if n != 12)
    // For simplicity, we assume contributions happen at the end of the period
    const totalValue = principalFutureValue + contributionsFutureValue;
    const totalContributions = P + PMT * 12 * t;
    const totalInterest = totalValue - totalContributions;

    return {
      totalValue,
      totalContributions,
      totalInterest,
    };
  }, [
    initialAmount,
    monthlyContribution,
    years,
    interestRate,
    compoundFrequency,
  ]);

  const saveToHistory = async () => {
    if (!results) return;
    await db.history.add({
      toolUrl: "/compound-interest-calculator",
      toolName: "Compound Interest Calculator",
      input: {
        initialAmount,
        monthlyContribution,
        years,
        interestRate,
        compoundFrequency,
      },
      result: results,
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
      .equals("/compound-interest-calculator")
      .delete();
  };

  const reset = () => {
    setInitialInvestment("5000");
    setMonthlyContribution("100");
    setYears("10");
    setInterestRate("7");
    setCompoundFrequency("12");
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
                <Wallet className="h-5 w-5 text-primary" />
                Investment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="initial">Initial Investment</Label>
                  <Input
                    id="initial"
                    type="number"
                    value={initialAmount}
                    onChange={(e) => setInitialInvestment(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="monthly">Monthly Contribution</Label>
                  <Input
                    id="monthly"
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="years">Time Horizon (Years)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="years"
                      type="number"
                      className="pl-10"
                      value={years}
                      onChange={(e) => setYears(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rate">Annual Interest Rate (%)</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rate"
                      type="number"
                      step="0.1"
                      className="pl-10"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Compounding Frequency</Label>
                <Select
                  value={compoundFrequency}
                  onValueChange={setCompoundFrequency}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Annually</SelectItem>
                    <SelectItem value="2">Semi-Annually</SelectItem>
                    <SelectItem value="4">Quarterly</SelectItem>
                    <SelectItem value="12">Monthly</SelectItem>
                    <SelectItem value="365">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={reset}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button onClick={saveToHistory} disabled={!results}>
                  Save Result
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Future Value Card for Mobile (hidden on Desktop) */}
          <div className="xl:hidden h-fit">
            <FutureValueCard results={results} years={years} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard
              label="Total Contributions"
              value={`${results?.totalContributions.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              color="text-blue-500"
            />
            <InfoCard
              label="Total Interest"
              value={`${results?.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              color="text-green-500"
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
                          {item.result.totalValue.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.input.years} years at {item.input.interestRate}%
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
                            setInitialInvestment(item.input.initialAmount);
                            setMonthlyContribution(
                              item.input.monthlyContribution,
                            );
                            setYears(item.input.years);
                            setInterestRate(item.input.interestRate);
                            setCompoundFrequency(item.input.compoundFrequency);
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

        {/* Future Value Card for Desktop (hidden on Mobile) */}
        <div className="hidden xl:block space-y-6 h-fit">
          <FutureValueCard results={results} years={years} />
        </div>
      </div>
    </div>
  );
}

function FutureValueCard({ results, years }: { results: any; years: string }) {
  return (
    <Card className="h-full border-t-4 border-t-primary overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg text-center">Future Value</CardTitle>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="text-center">
          <p className="text-5xl font-black text-primary">
            {results?.totalValue.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            }) || "—"}
          </p>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2 tracking-widest">
            Estimated Balance
          </p>
        </div>

        <div className="p-4 bg-muted/50 rounded-xl space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Investment Period:</span>
            <span className="font-bold">{years} Years</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Interest Earned:</span>
            <span className="font-bold text-green-600">
              +
              {results
                ? (
                    (results.totalInterest / results.totalContributions) *
                    100
                  ).toFixed(1)
                : "0.0"}
              %
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg text-left">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Compound interest is the interest on a loan or deposit calculated
            based on both the initial principal and the accumulated interest
            from previous periods.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">
          {label}
        </p>
        <p className={cn("text-2xl font-black", color)}>{value}</p>
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
