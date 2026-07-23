export const SEVERITY_COLORS = {
  Normal: "hsl(142 71% 45%)", // Green
  Mild: "hsl(43 96% 56%)",    // Yellow
  Moderate: "hsl(25 95% 53%)", // Orange
  Severe: "hsl(0 84% 60%)",    // Red
} as const;

export const SEVERITY_BG_COLORS = {
  Normal: "bg-[hsl(142_71%_45%/0.15)] text-[hsl(142_71%_45%)] border-[hsl(142_71%_45%/0.3)]",
  Mild: "bg-[hsl(43_96%_56%/0.15)] text-[hsl(43_96%_56%)] border-[hsl(43_96%_56%/0.3)]",
  Moderate: "bg-[hsl(25_95%_53%/0.15)] text-[hsl(25_95%_53%)] border-[hsl(25_95%_53%/0.3)]",
  Severe: "bg-[hsl(0_84%_60%/0.15)] text-[hsl(0_84%_60%)] border-[hsl(0_84%_60%/0.3)]",
} as const;
