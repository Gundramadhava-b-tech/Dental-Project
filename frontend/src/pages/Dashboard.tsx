import { useGetStats, useListAnalyses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, FileScan, ChevronRight, Clock, TrendingUp, AlertTriangle, Sparkles, ArrowUpRight, AlertCircle } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { SEVERITY_COLORS } from "@/lib/constants";
import { Link } from "wouter";
import { SeverityBadge } from "@/components/SeverityBadge";
import { format } from "date-fns";
import { useMemo } from "react";

const StackedTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-sm min-w-[160px]">
        <p className="text-muted-foreground mb-2 font-bold uppercase tracking-wider text-[10px]">{label}</p>
        {payload.slice().reverse().map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-foreground text-xs">{p.dataKey}</span>
            </div>
            <span className="font-bold text-foreground text-xs">{p.value}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-border/40 flex justify-between">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total</span>
          <span className="text-primary font-bold text-xs">{total}</span>
        </div>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-sm">
        <p className="font-semibold" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
        <p className="text-foreground font-bold">{payload[0].value} cases</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetStats();
  const { data: allAnalyses } = useListAnalyses();

  // Build per-month severity-stacked data from analyses
  const severityByMonth = useMemo(() => {
    if (!allAnalyses) return [] as Array<{ month: string; Normal: number; Mild: number; Moderate: number; Severe: number }>;
    const map = new Map<string, { month: string; Normal: number; Mild: number; Moderate: number; Severe: number; _ts: number }>();
    for (const a of allAnalyses) {
      const d = new Date(a.analyzedAt);
      const key = format(d, "MMM yyyy");
      const ts = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      if (!map.has(key)) map.set(key, { month: key, Normal: 0, Mild: 0, Moderate: 0, Severe: 0, _ts: ts });
      const row = map.get(key)!;
      (row as any)[a.severity] += 1;
    }
    return Array.from(map.values()).sort((a, b) => a._ts - b._ts).map(({ _ts, ...rest }) => rest);
  }, [allAnalyses]);

  // Critical findings: top severe/moderate cases by constriction
  const criticalFindings = useMemo(() => {
    if (!allAnalyses) return [];
    return allAnalyses
      .filter(a => a.severity === "Severe" || a.severity === "Moderate")
      .sort((a, b) => b.minConstriction - a.minConstriction)
      .slice(0, 4);
  }, [allAnalyses]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Activity className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold font-display text-foreground">Failed to load statistics</h2>
        <p className="text-muted-foreground mt-2">Make sure the API server is running.</p>
      </div>
    );
  }

  const pieData = [
    { name: "Normal", value: stats.severityDistribution.Normal, color: SEVERITY_COLORS.Normal },
    { name: "Mild", value: stats.severityDistribution.Mild, color: SEVERITY_COLORS.Mild },
    { name: "Moderate", value: stats.severityDistribution.Moderate, color: SEVERITY_COLORS.Moderate },
    { name: "Severe", value: stats.severityDistribution.Severe, color: SEVERITY_COLORS.Severe },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="section-header">
          <div className="text-xs font-semibold text-muted-foreground mb-1 tracking-widest uppercase">Home / Dashboard</div>
          <h1 className="text-4xl font-display font-extrabold text-foreground leading-tight">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">System-wide airway analysis statistics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-border/40 text-xs font-medium text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          Last updated: just now
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card className="stat-card rounded-2xl" style={{ borderTop: "2px solid hsl(175,100%,38%)", background: "#ffffff" }}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Patients</p>
                <h3 className="text-5xl font-display font-extrabold mt-3 text-foreground">{stats.totalPatients}</h3>
                <div className="flex items-center gap-1.5 mt-3">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-xs font-semibold text-emerald-400">+12% this month</p>
                </div>
              </div>
              <div className="p-3 rounded-2xl" style={{ background: "hsl(175,100%,38%,0.12)" }}>
                <Users className="w-6 h-6" style={{ color: "hsl(175,100%,50%)" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card rounded-2xl" style={{ borderTop: "2px solid hsl(43,96%,56%)", background: "#ffffff" }}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Scans</p>
                <h3 className="text-5xl font-display font-extrabold mt-3 text-foreground">{stats.totalScans}</h3>
                <div className="flex items-center gap-1.5 mt-3">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-xs font-semibold text-emerald-400">+8% this month</p>
                </div>
              </div>
              <div className="p-3 rounded-2xl" style={{ background: "hsl(43,96%,56%,0.12)" }}>
                <FileScan className="w-6 h-6" style={{ color: "hsl(43,96%,65%)" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card rounded-2xl" style={{ borderTop: "2px solid hsl(142,71%,45%)", background: "#ffffff" }}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg Airway Area</p>
                <h3 className="text-5xl font-display font-extrabold mt-3 text-foreground">
                  {stats.avgAirwayArea.toFixed(1)}<span className="text-2xl text-muted-foreground font-sans ml-1">mm²</span>
                </h3>
                <p className="text-xs font-medium text-muted-foreground mt-3">Stable across population</p>
              </div>
              <div className="p-3 rounded-2xl" style={{ background: "hsl(142,71%,45%,0.12)" }}>
                <Activity className="w-6 h-6" style={{ color: "hsl(142,71%,55%)" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {(() => {
          const highRisk = stats.severityDistribution.Moderate + stats.severityDistribution.Severe;
          const totalAnalyzed = stats.severityDistribution.Normal + stats.severityDistribution.Mild + highRisk;
          const pct = totalAnalyzed > 0 ? Math.round((highRisk / totalAnalyzed) * 100) : 0;
          return (
            <Card className="stat-card rounded-2xl" style={{ borderTop: "2px solid hsl(0,84%,60%)", background: "#ffffff" }}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">High Risk Cases</p>
                    <h3 className="text-5xl font-display font-extrabold mt-3 text-foreground">{highRisk}</h3>
                    <div className="flex items-center gap-1.5 mt-3">
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: "hsl(0,84%,65%)" }} />
                      <p className="text-xs font-semibold" style={{ color: "hsl(0,84%,70%)" }}>
                        {pct}% need follow-up
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl" style={{ background: "hsl(0,84%,60%,0.12)" }}>
                    <AlertTriangle className="w-6 h-6" style={{ color: "hsl(0,84%,65%)" }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Severity by Month — Stacked Bar */}
        <Card className="glass-panel rounded-2xl lg:col-span-2" style={{ background: "#ffffff" }}>
          <CardHeader className="pb-2 flex flex-row items-start justify-between">
            <div>
              <CardTitle className="font-display text-base font-bold">Severity Trend by Month</CardTitle>
              <p className="text-xs text-muted-foreground">Diagnoses across time, broken down by category</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              {(["Normal","Mild","Moderate","Severe"] as const).map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SEVERITY_COLORS[s] }} />
                  <span className="text-muted-foreground font-medium">{s}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[280px] pt-0">
            {severityByMonth.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No analyses yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityByMonth} margin={{ top: 16, right: 8, left: -24, bottom: 8 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(215,20%,45%)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="hsl(215,20%,45%)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<StackedTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="Normal"   stackId="s" fill={SEVERITY_COLORS.Normal}   radius={[0,0,0,0]} />
                  <Bar dataKey="Mild"     stackId="s" fill={SEVERITY_COLORS.Mild}     radius={[0,0,0,0]} />
                  <Bar dataKey="Moderate" stackId="s" fill={SEVERITY_COLORS.Moderate} radius={[0,0,0,0]} />
                  <Bar dataKey="Severe"   stackId="s" fill={SEVERITY_COLORS.Severe}   radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Severity Distribution — Donut */}
        <Card className="glass-panel rounded-2xl" style={{ background: "#ffffff" }}>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-bold">Severity Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">By diagnosis category</p>
          </CardHeader>
          <CardContent className="pt-0">
            {pieData.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold font-display text-foreground">{stats.totalScans}</div>
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-16">No data available</p>
            )}
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-2 px-1">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                  <span className="text-xs font-bold text-foreground ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights — Critical Findings */}
      <Card className="glass-panel rounded-2xl overflow-hidden relative" style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        borderTop: "1px solid hsl(175,100%,38%,0.3)"
      }}>
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[200px] pointer-events-none" style={{
          background: "radial-gradient(ellipse at top right, hsl(175 100% 50% / 0.08) 0%, transparent 70%)"
        }} />
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: "linear-gradient(135deg, hsl(175 100% 38% / 0.2), hsl(220 90% 50% / 0.15))",
              border: "1px solid hsl(175 100% 38% / 0.3)"
            }}>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-base font-bold flex items-center gap-2">
                AI Critical Findings
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20">Live</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">High-priority cases ranked by airway constriction</p>
            </div>
          </div>
          <Link href="/analyses" className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            View All Findings <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0 relative">
          {criticalFindings.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="inline-flex w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-foreground">No critical findings</p>
              <p className="text-xs text-muted-foreground mt-1">All recent analyses are within normal range.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/30">
              {criticalFindings.map((f, i) => {
                const color = f.severity === "Severe" ? "hsl(0,84%,60%)" : "hsl(25,95%,55%)";
                return (
                  <div key={f.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors" style={{ background: "#ffffff" }}>
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{
                        background: `${color.replace(")", ",0.12)")}`,
                        border: `1px solid ${color.replace(")", ",0.3)")}`
                      }}>
                        <AlertCircle className="w-5 h-5" style={{ color }} />
                      </div>
                      {i === 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-px rounded-full text-[8px] font-bold uppercase text-white" style={{ background: color }}>
                          #1
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-foreground truncate">{f.patientName}</p>
                        <SeverityBadge severity={f.severity} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(f.analyzedAt), "MMM d, yyyy • h:mm a")}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-display font-extrabold leading-none" style={{ color }}>
                        {f.minConstriction.toFixed(1)}<span className="text-sm font-bold ml-0.5">%</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">Constriction</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Analyses */}
      <Card className="glass-panel rounded-2xl overflow-hidden" style={{ background: "#ffffff" }}>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
          <div>
            <CardTitle className="font-display text-base font-bold">Recent Analyses</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Latest AI diagnostic results</p>
          </div>
          <Link href="/analyses" className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Patient</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Severity</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Constriction</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Area mm²</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAnalyses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground text-sm">No recent analyses found.</td>
                  </tr>
                ) : (
                  stats.recentAnalyses.map((analysis, i) => (
                    <tr
                      key={analysis.id}
                      className="border-b border-border/20 hover:bg-white/[0.025] transition-colors cursor-pointer group"
                      style={{ background: i % 2 === 1 ? "rgba(255,255,255,0.012)" : undefined }}
                      onClick={() => window.location.assign(`${import.meta.env.BASE_URL}patients/${analysis.patientId}`)}
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                            style={{ background: "hsl(175,100%,38%,0.15)", color: "hsl(175,100%,55%)", border: "1px solid hsl(175,100%,38%,0.25)" }}>
                            {analysis.patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold">{analysis.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><SeverityBadge severity={analysis.severity} /></td>
                      <td className="px-6 py-4 font-mono font-bold text-foreground">{analysis.minConstriction}%</td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">{analysis.airwayArea.toFixed(1)}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{format(new Date(analysis.analyzedAt), 'MMM d, yyyy')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
