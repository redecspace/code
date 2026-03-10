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
import { Slider } from "@/components/ui/slider";
import {
  Landmark,
  RefreshCcw,
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
import { MORTGAGE_CONTENT } from "@/data/tools/calculators/mortgage";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

export default function MortgageCalculator() {
  const { title, description, about, features, steps } = MORTGAGE_CONTENT;
  const [homePrice, setHomePrice] = useState(300000);
  const [downPayment, setDownPayment] = useState(60000);
  const [loanTerm, setLoanTerm] = useState(30);
  const [interestRate, setInterestRate] = useState(6.5);

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/mortgage-calculator")
      .reverse()
      .limit(5)
      .toArray(),
  );

  const results = useMemo(() => {
    const principal = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    let monthlyPayment = 0;
    if (monthlyRate === 0) {
      monthlyPayment = principal / numberOfPayments;
    } else {
      monthlyPayment =
        (principal *
          monthlyRate *
          Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - principal;

    return {
      monthlyPayment,
      totalPayment,
      totalInterest,
      principal,
    };
  }, [homePrice, downPayment, loanTerm, interestRate]);

  const saveToHistory = async () => {
    await db.history.add({
      toolUrl: "/mortgage-calculator",
      toolName: "Mortgage Calculator",
      input: { homePrice, downPayment, loanTerm, interestRate },
      result: results,
      timestamp: Date.now(),
    });
    toast.success("Result saved to history");
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/mortgage-calculator").delete();
  };

  const reset = () => {
    setHomePrice(300000);
    setDownPayment(60000);
    setLoanTerm(30);
    setInterestRate(6.5);
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
                <Landmark className="h-5 w-5 text-primary" />
                Loan Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Home Price: ${homePrice.toLocaleString()}</Label>
                  <Slider
                    value={[homePrice]}
                    min={50000}
                    max={2000000}
                    step={1000}
                    onValueChange={(val) => setHomePrice(val[0])}
                  />
                </div>
                <div className="space-y-4">
                  <Label>Down Payment: ${downPayment.toLocaleString()}</Label>
                  <Slider
                    value={[downPayment]}
                    min={0}
                    max={homePrice}
                    step={1000}
                    onValueChange={(val) => setDownPayment(val[0])}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="rate">Interest Rate (%)</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rate"
                      type="number"
                      step="0.1"
                      className="pl-10"
                      value={interestRate}
                      onChange={(e) =>
                        setInterestRate(parseFloat(e.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="term">Loan Term (Years)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="term"
                      type="number"
                      className="pl-10"
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={reset}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button onClick={saveToHistory}>Save Result</Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Card for Mobile (hidden on Desktop) */}
          <div className="xl:hidden h-fit">
            <MortgageResultCard
              results={results}
              downPayment={downPayment}
              reset={reset}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard
              label="Total Interest"
              value={`$${results.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              color="text-orange-500"
            />
            <InfoCard
              label="Total Cost"
              value={`$${results.totalPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              color="text-blue-500"
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
                          $
                          {item.result.monthlyPayment.toLocaleString(
                            undefined,
                            { maximumFractionDigits: 0 },
                          )}
                          /mo
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${item.input.homePrice.toLocaleString()} home,{" "}
                          {item.input.interestRate}% rate
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
                            setHomePrice(item.input.homePrice);
                            setDownPayment(item.input.downPayment);
                            setLoanTerm(item.input.loanTerm);
                            setInterestRate(item.input.interestRate);
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
          <MortgageResultCard
            results={results}
            downPayment={downPayment}
            reset={reset}
          />
        </div>
      </div>
    </div>
  );
}

function MortgageResultCard({ results, downPayment, reset }: any) {
  return (
    <Card className="h-full border-t-4 border-t-primary overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg text-center">Monthly Payment</CardTitle>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="text-center">
          <p className="text-6xl font-black text-primary">
            $
            {results.monthlyPayment.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2 tracking-widest">
            Per Month
          </p>
        </div>

        <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Loan Amount:</span>
            <span className="font-bold">
              ${results.principal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Down Payment:</span>
            <span className="font-bold">${downPayment.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg text-left">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Your monthly payment is estimated based on principal and interest.
            It does not include property taxes, insurance, or HOA fees.
          </p>
        </div>

        <Button variant="outline" className="w-full" onClick={reset}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
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
