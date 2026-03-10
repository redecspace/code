import { cn } from "@/lib/utils";
import React from "react";

interface SVGIconProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
}

export function SVGIcon({ src, className, style, ...props }: SVGIconProps) {
  return (
    <div
      className={cn("bg-current inline-block", className)}
      style={{
        maskImage: `url('${src}')`,
        WebkitMaskImage: `url('${src}')`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        ...style,
      }}
      {...props}
    />
  );
}
