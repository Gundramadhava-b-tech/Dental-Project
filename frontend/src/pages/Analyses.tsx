import { useState } from "react";
import { useListAnalyses } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, FileText, Download } from "lucide-react";
import type { ListAnalysesSeverity } from "@workspace/api-client-react/generated/api.schemas";
import { generateReport } from "@/lib/generateReport";

export default function Analyses() {
  const [severityFilter, setSeverityFilter] = useState<ListAnalysesSeverity | "ALL">("ALL");
  
  const { data: analyses = [], isLoading } = useListAnalyses(
    severityFilter !== "ALL" ? { severity: severityFilter } : undefined
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="section-header">
          <div className="text-xs font-semibold text-muted-foreground mb-1 tracking-widest uppercase">Home / Analyses</div>
          <h1 className="text-4xl font-display font-extrabold text-foreground leading-tight">Analysis Results</h1>
          <p className="text-muted-foreground mt-1 text-sm">Review all completed AI diagnostic reports</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          <Select value={severityFilter} onValueChange={(v: any) => setSeverityFilter(v)}>
            <SelectTrigger className="w-[160px] bg-card rounded-xl border-border/50">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severities</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Mild">Mild</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="Severe">Severe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Bar */}
      {!isLoading && analyses.length > 0 && (
        <div className="flex flex-wrap gap-4 items-center bg-secondary/30 p-4 rounded-xl border border-border/50">
          <div className="text-sm font-semibold text-foreground mr-2">Summary:</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--severity-normal))]" />
            <span className="text-sm text-muted-foreground">Normal: {analyses.filter(a => a.severity === 'Normal').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--severity-mild))]" />
            <span className="text-sm text-muted-foreground">Mild: {analyses.filter(a => a.severity === 'Mild').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--severity-moderate))]" />
            <span className="text-sm text-muted-foreground">Moderate: {analyses.filter(a => a.severity === 'Moderate').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--severity-severe))]" />
            <span className="text-sm text-muted-foreground">Severe: {analyses.filter(a => a.severity === 'Severe').length}</span>
          </div>
          <div className="ml-auto text-sm font-medium text-foreground">
            Total: {analyses.length} scans
          </div>
        </div>
      )}

      <Card className="glass-panel overflow-hidden border-none shadow-xl">
        <div className="overflow-x-auto relative max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Date / Time</th>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Severity</th>
                <th className="px-6 py-4 font-semibold">Area (mm²)</th>
                <th className="px-6 py-4 font-semibold">Vol (mm³)</th>
                <th className="px-6 py-4 font-semibold">Constriction</th>
                <th className="px-6 py-4 font-semibold text-right">Report</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Loading analyses...</td></tr>
              ) : analyses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-foreground">No analyses found</p>
                      <p className="text-muted-foreground mt-1">Try changing filters or upload a new scan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                analyses.map((analysis) => (
                  <tr key={analysis.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-foreground font-medium">{format(new Date(analysis.analyzedAt), 'MMM d, yyyy')}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(analysis.analyzedAt), 'h:mm a')}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{analysis.patientName}</td>
                    <td className="px-6 py-4"><SeverityBadge severity={analysis.severity} /></td>
                    <td className="px-6 py-4 font-mono font-medium">{analysis.airwayArea.toFixed(1)}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{analysis.airwayVolume.toFixed(0)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{analysis.minConstriction}%</span>
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                           <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${analysis.minConstriction}%`,
                                backgroundColor: `hsl(var(--severity-${analysis.severity.toLowerCase()}))`
                              }}
                            />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        title="Download PDF Report"
                        onClick={() => generateReport(analysis)}
                        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 inline-flex items-center gap-1.5 border border-primary/20 hover:border-primary shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-xs font-semibold">PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
