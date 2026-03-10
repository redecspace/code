"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  Monitor,
  RefreshCcw,
  Share2,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
  Smartphone,
  Laptop,
  Tv,
  Tablet,
  History,
  Trash2,
  RotateCcw,
  Star,
  ListChecks,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  COMMON_RATIOS,
  ASPECT_RATIO_CONTENT,
} from "@/data/tools/calculators/aspect-ratio";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

export default function AspectRatioCalculator() {
  const { title, description, about, features, steps } = ASPECT_RATIO_CONTENT;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getInitialValue = (key: string, fallback: string) => {
    const val = searchParams.get(key);
    const num = Number(val);
    return !isNaN(num) && val !== null ? val : fallback;
  };

  const [w, setW] = useState(getInitialValue("w", "1920"));
  const [h, setH] = useState(getInitialValue("h", "1080"));
  const [rw, setRw] = useState(getInitialValue("rw", "16"));
  const [rh, setRh] = useState(getInitialValue("rh", "9"));

  const history = useLiveQuery(() =>
    db.history
      .where("toolUrl")
      .equals("/aspect-ratio")
      .reverse()
      .limit(5)
      .toArray(),
  );

  const updateUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Keep width as "source of truth" when ratio changes
  const recalculateHeight = (width: number, ratioW: number, ratioH: number) => {
    if (ratioW <= 0 || ratioH <= 0 || isNaN(width)) return;
    const height = Math.round((width * ratioH) / ratioW);
    setH(height.toString());
    return height;
  };

  const handleWidthChange = (val: string) => {
    setW(val);
    const width = Number(val);
    const ratioW = Number(rw);
    const ratioH = Number(rh);

    if (!isNaN(width) && ratioW > 0 && ratioH > 0) {
      const height = recalculateHeight(width, ratioW, ratioH);
      if (height !== undefined) {
        updateUrl({ w: val, h: height.toString() });
      }
    }
  };

  const handleHeightChange = (val: string) => {
    setH(val);
    const height = Number(val);
    const ratioW = Number(rw);
    const ratioH = Number(rh);

    if (!isNaN(height) && ratioW > 0 && ratioH > 0) {
      const width = Math.round((height * ratioW) / ratioH);
      setW(width.toString());
      updateUrl({ w: width.toString(), h: val });
    }
  };

  const handleRatioWChange = (val: string) => {
    setRw(val);
    const ratioW = Number(val);
    const width = Number(w);
    const ratioH = Number(rh);

    if (!isNaN(ratioW) && ratioW > 0 && !isNaN(width) && ratioH > 0) {
      const height = recalculateHeight(width, ratioW, ratioH);
      if (height !== undefined) {
        updateUrl({ rw: val, h: height.toString() });
      }
    }
  };

  const handleRatioHChange = (val: string) => {
    setRh(val);
    const ratioH = Number(val);
    const width = Number(w);
    const ratioW = Number(rw);

    if (!isNaN(ratioH) && ratioH > 0 && !isNaN(width) && ratioW > 0) {
      const height = recalculateHeight(width, ratioW, ratioH);
      if (height !== undefined) {
        updateUrl({ rh: val, h: height.toString() });
      }
    }
  };

  const applyCommonRatio = (ratioW: number, ratioH: number) => {
    if (ratioW <= 0 || ratioH <= 0) {
      toast.error("Invalid ratio selected");
      return;
    }

    setRw(ratioW.toString());
    setRh(ratioH.toString());

    const width = Number(w);
    if (!isNaN(width)) {
      const height = recalculateHeight(width, ratioW, ratioH);
      if (height !== undefined) {
        updateUrl({
          rw: ratioW.toString(),
          rh: ratioH.toString(),
          h: height.toString(),
        });
      }
    }
  };

  const saveToHistory = async () => {
    await db.history.add({
      toolUrl: "/aspect-ratio",
      toolName: "Aspect Ratio Calculator",
      input: { w, h, rw, rh },
      result: { ratio: `${rw}:${rh}`, dimensions: `${w}x${h}` },
      timestamp: Date.now(),
    });
    toast.success("Result saved to history");
  };

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id);
  };

  const clearAllHistory = async () => {
    await db.history.where("toolUrl").equals("/aspect-ratio").delete();
  };

  const reset = () => {
    setW("1920");
    setH("1080");
    setRw("16");
    setRh("9");
    router.push(pathname, { scroll: false });
  };

  const share = () => {
    const url = window.location.href;
    const text = `Aspect Ratio: ${rw}:${rh} → ${w} × ${h} pixels`;

    if (navigator.share) {
      navigator.share({ title: "Aspect Ratio", text, url }).catch(() => {
        navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const getRatioIcon = (label: string) => {
    if (label === "9:16") return Smartphone;
    if (label === "16:9") return Tv;
    if (label === "21:9") return Monitor;
    if (label === "4:3") return Laptop;
    if (label === "3:2" || label === "2:3") return Tablet;
    return Maximize2;
  };

  // Optional: sync if URL changes externally (rare in this case)
  useEffect(() => {
    const newW = getInitialValue("w", "1920");
    const newH = getInitialValue("h", "1080");
    const newRw = getInitialValue("rw", "16");
    const newRh = getInitialValue("rh", "9");

    if (newW !== w) setW(newW);
    if (newH !== h) setH(newH);
    if (newRw !== rw) setRw(newRw);
    if (newRh !== rh) setRh(newRh);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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
                <Maximize2 className="h-5 w-5 text-primary" />
                Dimensions
              </CardTitle>
              <CardDescription>
                Enter width or height to calculate the other based on ratio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="width">Width (px)</Label>
                  <div className="relative">
                    <MoveHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="width"
                      type="number"
                      placeholder="Width"
                      className="pl-10"
                      value={w}
                      onChange={(e) => handleWidthChange(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="height">Height (px)</Label>
                  <div className="relative">
                    <MoveVertical className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="height"
                      type="number"
                      placeholder="Height"
                      className="pl-10"
                      value={h}
                      onChange={(e) => handleHeightChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Aspect Ratio
              </CardTitle>
              <CardDescription>
                Define the base ratio for calculation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="ratioW">Ratio Width</Label>
                  <Input
                    id="ratioW"
                    type="number"
                    placeholder="Ratio Width"
                    value={rw}
                    onChange={(e) => handleRatioWChange(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ratioH">Ratio Height</Label>
                  <Input
                    id="ratioH"
                    type="number"
                    placeholder="Ratio Height"
                    value={rh}
                    onChange={(e) => handleRatioHChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Button className="flex-1" onClick={saveToHistory}>
                  Save Result
                </Button>

                <Button variant="outline" onClick={share}>
                  <Share2 className="mr-2 h-4 w-4" /> Share Result
                </Button>
                <Button variant="outline" size="icon" onClick={reset}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Common Ratios for Mobile (hidden on Desktop) */}
          <div className="xl:hidden h-fit">
            <CommonRatios
              rw={rw}
              rh={rh}
              applyCommonRatio={applyCommonRatio}
              getRatioIcon={getRatioIcon}
            />
          </div>

          {/* Visual Preview */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-widest text-muted-foreground">
              Visual Preview
            </h3>
            <div className="w-full bg-muted/20 rounded p-4 sm:p-12 flex items-center justify-center min-h-45 border-2 border-dashed border-muted/50 overflow-hidden">
              <div
                className="relative bg-background dark:bg-black border-2 border-border rounded-3xl shadow-2xl transition-all duration-500 ease-in-out flex flex-col items-center justify-center overflow-hidden"
                style={{
                  aspectRatio: `${rw}/${rh}`,
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                <div className="absolute inset-0 bg-primary/5 flex flex-col items-center justify-center p-6 text-center">
                  <div className="p-5 sm:p-6 rounded-2xl bg-background/80 backdrop-blur-sm border shadow-md animate-in zoom-in-95 duration-300">
                    <div className="text-4xl sm:text-6xl font-black text-primary mb-2 tracking-tight">
                      {rw}:{rh}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-muted-foreground uppercase tracking-widest opacity-80">
                      {w} × {h} Pixels
                    </div>
                  </div>

                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-foreground rounded-full opacity-25" />
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-10 h-2 bg-foreground rounded-full opacity-25" />
                </div>
              </div>
            </div>
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
                        <p className="font-bold text-lg">{item.result.ratio}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.result.dimensions}
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
                            setW(item.input.w);
                            setH(item.input.h);
                            setRw(item.input.rw);
                            setRh(item.input.rh);
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
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aspect ratio is the proportional relationship between width and
                height. Enter any two values (width, height, or ratio) and the
                rest will be calculated automatically. The preview shows how
                your current ratio would appear on screen.
              </p>
            </div>
          </div>
        </div>

        {/* Common Ratios for Desktop (hidden on Mobile) */}
        <div className="hidden xl:block space-y-6 h-fit">
          <CommonRatios
            rw={rw}
            rh={rh}
            applyCommonRatio={applyCommonRatio}
            getRatioIcon={getRatioIcon}
          />
        </div>
      </div>
    </div>
  );
}

function CommonRatios({
  rw,
  rh,
  applyCommonRatio,
  getRatioIcon,
}: {
  rw: string;
  rh: string;
  applyCommonRatio: (w: number, h: number) => void;
  getRatioIcon: (label: string) => any;
}) {
  return (
    <Card className="h-full border-t-4 border-t-primary overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg">Common Ratios</CardTitle>
        <CardDescription>Quick presets for standard sizes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {COMMON_RATIOS.map((ratio) => {
          const Icon = getRatioIcon(ratio.label);
          return (
            <button
              key={ratio.label}
              onClick={() => applyCommonRatio(ratio.width, ratio.height)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all hover:bg-accent group",
                rw === ratio.width.toString() && rh === ratio.height.toString()
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-muted/50",
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5")} />
                  <span className="font-bold">{ratio.label}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                  Apply
                </span>
              </div>
              <p className="text-xs leading-snug">{ratio.description}</p>
            </button>
          );
        })}
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
