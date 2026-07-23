import { Badge } from "@/components/ui/badge";
import { SEVERITY_BG_COLORS } from "@/lib/constants";
import { Activity } from "lucide-react";

export function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity) return <Badge variant="outline" className="text-muted-foreground border-border bg-card">N/A</Badge>;
  
  const colorClass = SEVERITY_BG_COLORS[severity as keyof typeof SEVERITY_BG_COLORS] || SEVERITY_BG_COLORS.Normal;

  return (
    <Badge variant="outline" className={`${colorClass} flex items-center gap-1.5 px-2.5 py-0.5 font-medium`}>
      <Activity className="w-3 h-3" />
      {severity}
    </Badge>
  );
}
