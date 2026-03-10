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
  Divide,
  RefreshCcw,
  Plus,
  Minus,
  X,
  Equal,
  History,
  Trash2,
  RotateCcw,
  Star,
  ListChecks,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FRACTION_CONTENT } from "@/data/tools/calculators/fraction";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

type Operation = "add" | "subtract" | "multiply" | "divide";

export default function FractionCalculator() {
  const { title, description, about, features, steps } = FRACTION_CONTENT;
  const [n1, setN1] = useState("1");
  const [d1, setD1] = useState("2");
  const [n2, setN2] = useState("1");
  const [d2, setD2] = useState("4");
  const [op, setOp] = useState<Operation>("add");

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/fraction-calculator")
      .reverse()
      .limit(5)
      .toArray(),
  );

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  const result = useMemo(() => {
    const num1 = parseInt(n1);
    const den1 = parseInt(d1);
    const num2 = parseInt(n2);
    const den2 = parseInt(d2);

    if (
      isNaN(num1) ||
      isNaN(den1) ||
      isNaN(num2) ||
      isNaN(den2) ||
      den1 === 0 ||
      den2 === 0
    )
      return null;

    let resNum = 0;
    let resDen = 1;

    switch (op) {
      case "add":
        resNum = num1 * den2 + num2 * den1;
        resDen = den1 * den2;
        break;
      case "subtract":
        resNum = num1 * den2 - num2 * den1;
        resDen = den1 * den2;
        break;
      case "multiply":
        resNum = num1 * num2;
        resDen = den1 * den2;
        break;
      case "divide":
        resNum = num1 * den2;
        resDen = den1 * num2;
        break;
    }

    if (resDen === 0) return "Error";

    const common = Math.abs(gcd(resNum, resDen));
    const simplifiedNum = resNum / common;
    const simplifiedDen = resDen / common;

    return {
      num: simplifiedNum,
      den: simplifiedDen,
      decimal: (simplifiedNum / simplifiedDen).toFixed(4),
      mixed: {
        whole:
          Math.floor(Math.abs(simplifiedNum) / simplifiedDen) *
          (simplifiedNum < 0 ? -1 : 1),
        num: Math.abs(simplifiedNum) % simplifiedDen,
        den: simplifiedDen,
      },
    };
  }, [n1, d1, n2, d2, op]);

  const saveToHistory = async () => {
    if (!result || typeof result === "string") return;
    await db.history.add({
      toolUrl: "/fraction-calculator",
      toolName: "Fraction Calculator",
      input: { n1, d1, n2, d2, op },
      result: result,
      timestamp: Date.now(),
    });
    toast.success("Result saved to history");
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/fraction-calculator").delete();
  };

  const reset = () => {
    setN1("1");
    setD1("2");
    setN2("1");
    setD2("4");
    setOp("add");
  };

  const getOpSymbol = (o: Operation) => {
    switch (o) {
      case "add":
        return "+";
      case "subtract":
        return "-";
      case "multiply":
        return "x";
      case "divide":
        return "÷";
    }
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
              <CardTitle className="text-lg">Fraction Arithmetic</CardTitle>
              <CardDescription>
                Enter two fractions and select an operation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 pt-4">
                {/* Fraction 1 */}
                <FractionInput
                  n={n1}
                  d={d1}
                  onNChange={setN1}
                  onDChange={setD1}
                  label="Fraction 1"
                />

                {/* Operator */}
                <div className="flex flex-wrap justify-center gap-2 md:mt-6">
                  <OpButton
                    active={op === "add"}
                    icon={Plus}
                    onClick={() => setOp("add")}
                  />
                  <OpButton
                    active={op === "subtract"}
                    icon={Minus}
                    onClick={() => setOp("subtract")}
                  />
                  <OpButton
                    active={op === "multiply"}
                    icon={X}
                    onClick={() => setOp("multiply")}
                  />
                  <OpButton
                    active={op === "divide"}
                    icon={Divide}
                    onClick={() => setOp("divide")}
                  />
                </div>

                {/* Fraction 2 */}
                <FractionInput
                  n={n2}
                  d={d2}
                  onNChange={setN2}
                  onDChange={setD2}
                  label="Fraction 2"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={reset}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button
                  onClick={saveToHistory}
                  disabled={!result || typeof result === "string"}
                >
                  Save Result
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Card for Mobile (hidden on Desktop) */}
          <div className="xl:hidden h-fit">
            <FractionResultCard result={result} />
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
                          {item.result.num}/{item.result.den}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.input.n1}/{item.input.d1}{" "}
                          {getOpSymbol(item.input.op)} {item.input.n2}/
                          {item.input.d2}
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
                            setN1(item.input.n1);
                            setD1(item.input.d1);
                            setN2(item.input.n2);
                            setD2(item.input.d2);
                            setOp(item.input.op);
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
              <h3 className="text-sm font-semibold mb-3">How it works</h3>
              <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                <p>
                  <strong>Addition/Subtraction:</strong> To add or subtract
                  fractions, they must have a common denominator. We multiply
                  the numerators by the opposite denominators and then
                  add/subtract the results.
                </p>
                <p>
                  <strong>Multiplication:</strong> Multiply the numerators
                  together and the denominators together.
                </p>
                <p>
                  <strong>Division:</strong> Multiply the first fraction by the
                  reciprocal (flipped version) of the second fraction.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Result Card for Desktop (hidden on Mobile) */}
        <div className="hidden xl:block space-y-6 h-fit">
          <FractionResultCard result={result} />
        </div>
      </div>
    </div>
  );
}

function FractionResultCard({ result }: { result: any }) {
  return (
    <Card className="h-full border-t-4 border-t-primary overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg text-center">Result</CardTitle>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="flex flex-col items-center">
          {typeof result === "object" && result ? (
            <div className="flex flex-col items-center">
              <div className="text-6xl font-black text-primary border-b-4 border-primary pb-2 px-6 mb-2">
                {result.num}
              </div>
              <div className="text-6xl font-black text-primary pt-2 px-6">
                {result.den}
              </div>
            </div>
          ) : (
            <div className="text-4xl font-black text-destructive py-12">
              {result === "Error" ? "Division by 0" : "Enter Data"}
            </div>
          )}
        </div>

        {result && typeof result === "object" && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-xl flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Mixed Number
              </span>
              <div className="text-xl font-bold flex items-center gap-1.5">
                {Math.abs(result.mixed.whole) > 0 && (
                  <span>{result.mixed.whole}</span>
                )}
                {result.mixed.num > 0 && (
                  <div className="flex flex-col items-center text-[10px] leading-tight">
                    <span className="border-b border-foreground px-1">
                      {result.mixed.num}
                    </span>
                    <span className="px-1">{result.mixed.den}</span>
                  </div>
                )}
                {result.mixed.whole === 0 && result.mixed.num === 0 && (
                  <span>0</span>
                )}
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Decimal
              </span>
              <span className="text-xl font-bold">{result.decimal}</span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg text-left">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Fractions are simplified using the Greatest Common Divisor (GCD).
            Proper fractions have a numerator smaller than the denominator.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FractionInput({ n, d, onNChange, onDChange, label }: any) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Label className="mb-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
        {label}
      </Label>
      <Input
        type="number"
        value={n}
        onChange={(e) => onNChange(e.target.value)}
        className="w-20 text-center font-bold text-2xl border-0 h-12"
      />
      <div className="w-16 h-1 bg-muted-foreground/30" />
      <Input
        type="number"
        value={d}
        onChange={(e) => onDChange(e.target.value)}
        className={cn(
          "w-20 text-center font-bold text-2xl border-0 h-12",
          parseInt(d) === 0 && "text-destructive",
        )}
      />
    </div>
  );
}

function OpButton({ active, icon: Icon, onClick }: any) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="icon"
      className="h-10 w-10 rounded-full"
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </Button>
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

// function FractionInput({ n, d, onNChange, onDChange, label }: any) {
//   return (
//     <div className="flex flex-col items-center gap-2">
//       <Label className="mb-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{label}</Label>
//       <Input
//         type="number"
//         value={n}
//         onChange={(e) => onNChange(e.target.value)}
//         className="w-20 text-center font-bold text-lg border-0"
//       />
//       <div className="w-16 h-0.5 bg-muted-foreground/30" />
//       <Input
//         type="number"
//         value={d}
//         onChange={(e) => onDChange(e.target.value)}
//         className={cn("w-20 text-center font-bold text-lg border-0", parseInt(d) === 0 && "border-destructive text-destructive")}
//       />
//     </div>
//   );
// }

// function OpButton({ active, icon: Icon, onClick }: any) {
//   return (
//     <Button
//       variant={active ? "default" : "outline"}
//       size="icon"
//       className="h-10 w-10 rounded-full"
//       onClick={onClick}
//     >
//       <Icon className="h-4 w-4" />
//     </Button>
//   );
// }
