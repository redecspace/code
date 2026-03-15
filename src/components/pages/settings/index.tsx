"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Database,
  Trash2,
  ShieldAlert,
  RotateCcw,
  Info,
  Settings,
  Sun,
  Moon,
  Palette,
  Tablet,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const history = useLiveQuery(() => db.history.toArray());
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Group history by tool to allow tool-wise deletion
  const toolStats = useMemo(() => {
    if (!history) return [];
    const stats: Record<string, { count: number; name: string; url: string }> =
      {};

    history.forEach((item) => {
      if (!stats[item.toolUrl]) {
        stats[item.toolUrl] = {
          count: 0,
          name: item.toolName,
          url: item.toolUrl,
        };
      }
      stats[item.toolUrl].count++;
    });

    return Object.values(stats);
  }, [history]);

  const clearAllHistory = async () => {
    if (
      confirm(
        "Are you sure you want to delete ALL calculation history? This cannot be undone.",
      )
    ) {
      await db.history.clear();
      toast.success("All history cleared successfully");
    }
  };

  const deleteToolHistory = async (url: string, name: string) => {
    if (confirm(`Delete all history for ${name}?`)) {
      await db.history.where("toolUrl").equals(url).delete();
      toast.success(`History for ${name} cleared`);
    }
  };

  const clearAppCache = async () => {
    setIsClearingCache(true);
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      toast.success("App cache cleared. The page will reload.");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error("Failed to clear cache");
      console.error(error);
    } finally {
      setIsClearingCache(false);
    }
  };

  const totalHistoryCount = history?.length || 0;

  return (
    <div className="max-w-5xl mr-auto space-y-8 animate-fade-in pb-10">
      <div>
              
        <h1 className="text-xl sm:text-3xl font-extrabold font-display flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your local data, storage, and offline preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Appearance Card */}
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>
              Customize how Redec looks on your device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mounted ? (
              <RadioGroup
                defaultValue={resolvedTheme}
                onValueChange={(v) => setTheme(v)}
                className="flex flex-wrap w-full gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="light"
                    id="light"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="light"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-muted/40 p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:bg-accent peer-data-[state=checked]:text-accent-foreground  [&:has([data-state=checked])]:text-accent-foreground [&:has([data-state=checked])]:bg-accent cursor-pointer"
                  >
                    <Sun className="h-6 w-6" />
                    <span className="sr-only">Light</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="dark"
                    id="dark"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="dark"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-muted/40  p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:bg-accent peer-data-[state=checked]:text-accent-foreground  [&:has([data-state=checked])]:text-accent-foreground [&:has([data-state=checked])]:bg-accent cursor-pointer"
                  >
                    <Moon className="h-6 w-6" />
                    <span className="sr-only">Dark</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="system"
                    id="system"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="system"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-muted/40 p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:bg-accent peer-data-[state=checked]:text-accent-foreground  [&:has([data-state=checked])]:text-accent-foreground [&:has([data-state=checked])]:bg-accent cursor-pointer"
                  >
                    <Tablet className=" h-6 w-6" />
                    <span className="sr-only">System</span>
                  </Label>
                </div>
              </RadioGroup>
            ) : (
              <div className="flex flex-wrap w-full gap-4">
                <div className="h-14 w-14 rounded-md bg-muted/40 animate-pulse" />
                <div className="h-14 w-14 rounded-md bg-muted/40 animate-pulse" />
                <div className="h-14 w-14 rounded-md bg-muted/40 animate-pulse" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data & Storage Card */}
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex gap-2 flex-wrap items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>Data & Storage</CardTitle>
              </div>
              <Badge variant="secondary">{totalHistoryCount} items saved</Badge>
            </div>
            <CardDescription>
              Calculation history is stored locally on your device using
              IndexedDB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap items-center justify-between p-4 bg-muted/30 rounded-lg border">
                <div>
                  <p className="font-bold">Clear All Data</p>
                  <p className="text-sm text-muted-foreground">
                    Wipe all tool history across the entire application.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearAllHistory}
                  disabled={totalHistoryCount === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Clear All
                </Button>
              </div>

              <div className="flex gap-2 flex-wrap items-center justify-between p-4 bg-muted/30 rounded-lg border">
                <div>
                  <p className="font-bold">Reset Application Cache</p>
                  <p className="text-sm text-muted-foreground">
                    Clear cached assets and force a fresh update from the
                    server.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAppCache}
                  disabled={isClearingCache}
                >
                  <RotateCcw
                    className={cn(
                      "h-4 w-4 mr-2",
                      isClearingCache && "animate-spin",
                    )}
                  />
                  {isClearingCache ? "Clearing..." : "Clear Cache"}
                </Button>
              </div>
            </div>

            {toolStats.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Manage Tool Data
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {toolStats.map((tool) => (
                    <div
                      key={tool.url}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card"
                    >
                      <div>
                        <p className="font-semibold text-sm">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tool.count} records
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteToolHistory(tool.url, tool.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy & Security Info */}
        <Card className="bg-primary/5 border-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Privacy & Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p>
                  <strong>Redec is privacy-first.</strong> Your saved data never
                  leaves your device. All records are stored in your browser's{" "}
                  <strong>IndexedDB</strong> and are not sent to any server.
                </p>
                <p className="text-muted-foreground">
                  Clearing your browser's site data or using the options above
                  will permanently delete this information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
