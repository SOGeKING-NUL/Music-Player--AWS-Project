import React from "react";
import { cn } from "@/lib/utils";

export const NoiseBackground = ({
  children,
  containerClassName,
  gradientColors = [
    "rgb(255, 100, 150)",
    "rgb(100, 150, 255)",
    "rgb(255, 200, 100)",
  ],
}: {
  children: React.ReactNode;
  containerClassName?: string;
  gradientColors?: string[];
}) => {
  return (
    <div
      className={cn("relative", containerClassName)}
      style={{
        background: `linear-gradient(135deg, ${gradientColors.join(", ")})`,
      }}
    >
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full">
          <filter id="noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};
