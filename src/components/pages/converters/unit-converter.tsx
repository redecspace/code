"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeftRight,
  Copy,
  Check,
  History,
  Trash2,
  RotateCcw,
  Info,
  Star,
  ListChecks,
  Calculator,
  RefreshCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UNIT_CATEGORIES,
  UNIT_CONVERTER_CONTENT,
} from "@/data/tools/converters/unit-converter";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

export default function UnitConverter() {
  const { title, description, about, features, steps } = UNIT_CONVERTER_CONTENT;
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [fromUnit, setFromUnit] = useState(UNIT_CATEGORIES[0].units[0].value);
  const [toUnit, setToUnit] = useState(UNIT_CATEGORIES[0].units[1].value);
  const [inputVal, setInputVal] = useState("1");
  const [copied, setCopied] = useState(false);

  const cat = UNIT_CATEGORIES[categoryIdx];
  const from = cat.units.find((u) => u.value === fromUnit)!;
  const to = cat.units.find((u) => u.value === toUnit)!;

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/unit-converter")
      .reverse()
      .limit(5)
      .toArray(),
  );

  const result = useMemo(() => {
    const num = parseFloat(inputVal);
    if (isNaN(num)) return "";
    const base = from.toBase(num);
    return to.fromBase(base);
  }, [inputVal, from, to]);

  const formattedResult = useMemo(() => {
    if (typeof result === "string") return "";
    return result.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [result]);

  const handleCategoryChange = (val: string) => {
    const idx = parseInt(val);
    setCategoryIdx(idx);
    setFromUnit(UNIT_CATEGORIES[idx].units[0].value);
    setToUnit(UNIT_CATEGORIES[idx].units[1].value);
    setInputVal("1");
    setCopied(false);
  };

  const saveToHistory = async () => {
    if (inputVal === "" || isNaN(parseFloat(inputVal))) return;
    await db.history.add({
      toolUrl: "/unit-converter",
      toolName: `Unit Converter (${cat.name})`,
      input: { categoryIdx, fromUnit, toUnit, inputVal },
      result: { formattedResult, fromLabel: from.label, toLabel: to.label },
      timestamp: Date.now(),
    });
    toast.success("Conversion saved to history");
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/unit-converter").delete();
  };

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setCopied(false);
  };

  const copy = () => {
    if (!formattedResult) return;
    navigator.clipboard.writeText(formattedResult);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
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
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Conversion
              </CardTitle>
              <CardDescription>Select units and enter values</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="space-y-2">
                <Label>Select Category</Label>
                <Select
                  value={String(categoryIdx)}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_CATEGORIES.map((c, i) => (
                      <SelectItem key={c.name} value={String(i)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-4">
                <div className="flex flex-col gap-2">
                  <Label>From ({from.label})</Label>
                  <Select value={fromUnit} onValueChange={setFromUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cat.units.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={inputVal}
                    onChange={(e) => {
                      setInputVal(e.target.value);
                      setCopied(false);
                    }}
                  />
                </div>

                <div className="flex justify-center mb-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={swap}
                    className="rounded-full"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>To ({to.label})</Label>
                  <Select value={toUnit} onValueChange={setToUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cat.units.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative group">
                    <Input
                      readOnly
                      value={formattedResult}
                      className="bg-muted/50 font-bold pr-10"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <Tooltip open={copied}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded"
                            onClick={copy}
                            disabled={!formattedResult}
                          >
                            {copied ? (
                              <Check className="h-3.5 w-3.5 text-success" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Copied!</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setInputVal("1")}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button onClick={saveToHistory} disabled={!formattedResult}>
                  Save Result
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Summary for Mobile */}
          <div className="xl:hidden h-fit">
            <ResultSummary
              inputVal={inputVal}
              fromLabel={from.label}
              toLabel={to.label}
              result={formattedResult}
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
                          {item.input.inputVal} {item.result.fromLabel} ={" "}
                          {item.result.formattedResult} {item.result.toLabel}
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
                            setCategoryIdx(item.input.categoryIdx);
                            setFromUnit(item.input.fromUnit);
                            setToUnit(item.input.toUnit);
                            setInputVal(item.input.inputVal);
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
          <ResultSummary
            inputVal={inputVal}
            fromLabel={from.label}
            toLabel={to.label}
            result={formattedResult}
          />
        </div>
      </div>
    </div>
  );
}

function ResultSummary({
  inputVal,
  fromLabel,
  toLabel,
  result,
}: {
  inputVal: string;
  fromLabel: string;
  toLabel: string;
  result: string;
}) {
  return (
    <Card className="h-full border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle className="text-lg text-center">Conversion Result</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
            {inputVal} {fromLabel} equals
          </p>
          <p className="text-4xl font-black text-primary break-all">
            {result || "—"}
          </p>
          <p className="text-lg font-bold text-muted-foreground mt-1">
            {toLabel}
          </p>
        </div>

        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg text-left">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Values are rounded to 6 decimal places. Use the copy button to
            capture the full precision result.
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
