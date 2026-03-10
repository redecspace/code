"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import { tools } from "@/data/tools";

import { SVGIcon } from "@/components/common/svg-icon";

const Index = () => {
  return (
    <div className="max-w-5xl mr-auto animate-fade-in">
      <div className="text-left mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold font-display tracking-tight mb-3">
          Free <span className="text-primary">Tools</span> for you
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl ">
          A growing collection of useful tools — fast, free, and Open
          source.
        </p>
      </div>

      {tools.map((cat) => (
        <section key={cat.category} className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {cat.category}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cat.items.map((tool) => (
              <Link key={tool.url} href={tool.url}>
                <Card className="group hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <SVGIcon
                          src={tool.icon}
                              className="h-5 min-w-5 transition-all flex items-center justify-center"
                        />
                      </div>
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                    </div>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Index;
