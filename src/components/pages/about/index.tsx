"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/data/constants";
import { Info, Shield, Zap, Heart, Code, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { tools } from "@/data/tools";

export default function AboutPage() {
  const values = [
    {
      title: "Privacy First",
      description: "Most of our tools process data entirely in your browser. Your files and data never touch our servers.",
      icon: Shield,
      color: "text-green-500",
    },
    {
      title: "Lightning Fast",
      description: "Optimized for speed and efficiency, ensuring you get your results in seconds without any lag.",
      icon: Zap,
      color: "text-amber-500",
    },
    {
      title: "Open Source",
      description: "We believe in transparency. Many of our core engines are powered by open-source technology.",
      icon: Code,
      color: "text-blue-500",
    },
    {
      title: "Always Free",
      description: "Our mission is to provide high-quality utility tools to everyone, everywhere, for free.",
      icon: Heart,
      color: "text-red-500",
    },
  ];

  const categories = tools.map(group => group.category);

  return (
    <div className="max-w-5xl mr-auto animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-xl sm:text-3xl font-extrabold font-display">
          About <span className="text-primary">{APP_NAME}</span>
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          {APP_NAME} is a growing platform of versatile utility tools designed to make your digital life easier. From simple daily utilities to complex, heavy-tasking engines, we build tools that are fast, secure, and accessible to everyone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {values.map((value, i) => (
          <Card key={i} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className={cn("p-2 rounded bg-muted/50", value.color)}>
                <value.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-semibold">{value.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-primary" /> Our Vision
          </h2>
          <Card className="rounded border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The internet is full of tools that require expensive subscriptions or compromise user privacy. {APP_NAME} was born out of a desire to change that. We aim to become the go-to destination for high-quality, client-side utility tools that respect your time and your data.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Whether you're looking for a simple calculator or a heavy-duty processing engine, {APP_NAME} provides professional-grade capabilities without the professional-grade price tag.
              </p>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-primary" /> Growing Collection
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            We are constantly expanding our library. Currently, we offer tools across these evolving categories:
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded uppercase tracking-wider"
              >
                {cat}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
