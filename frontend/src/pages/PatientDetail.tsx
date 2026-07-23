import { useParams, Link } from "wouter";
import { useGetPatient, useListAnalyses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Mail, Phone, Calendar, User2, Activity, FileScan,
  TrendingDown, AlertTriangle, Download, Sparkles, ChevronRight,
} from "lucide-react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SEVERITY_COLORS } from "@/lib/constants";
import { format } from "date-fns";
import { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { generateReport } from "@/lib/generateReport";

const TimelineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-sm min-w-[160px]">
        <p className="text-muted-foreground mb-1 font-bold uppercase tracking-wider text-[10px]">{label}</p>
        <p className="font-bold text-foreground text-base">{payload[0].value}<span className="text-xs text-muted-foreground ml-1">% constriction</span></p>
      </div>
    );
  }
  return null;
};

export default function PatientDetail() {
  const params = useParams<{ id: string }>();
  const patientId = Number(params.id);

  const { data: patient, isLoading: loadingPatient, isError } = useGetPatient(patientId);
  const { data: analyses = [], isLoading: loadingAnalyses } = useListAnalyses({ patientId });

  const sortedAnalyses = useMemo(
    () => [...analyses].sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()),
    [analyses],
  );

  const timelineData = useMemo(() => {
    return [...analyses]
      .sort((a, b) => new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime())
      .map(a => ({
        date: format(new Date(a.analyzedAt), "MMM d"),
        constriction: Number(a.minConstriction.toFixed(1)),
        severity: a.severity,
      }));
  }, [analyses]);

  const stats = useMemo(() => {
    if (analyses.length === 0) {
      return { totalScans: 0, avgArea: 0, avgConstriction: 0, latestSeverity: null as any, worstSeverity: null as any };
    }
    const avgArea = analyses.reduce((s, a) => s + a.airwayArea, 0) / analyses.length;
    const avgConstriction = analyses.reduce((s, a) => s + a.minConstriction, 0) / analyses.length;
    const order = { Normal: 0, Mild: 1, Moderate: 2, Severe: 3 };
    const worst = analyses.reduce((w, a) =>
      (order[a.severity as keyof typeof order] ?? 0) > (order[w.severity as keyof typeof order] ?? 0) ? a : w
    );
    const latest = sortedAnalyses[0];
    return {
      totalScans: analyses.length,
      avgArea,
      avgConstriction,
      latestSeverity: latest.severity,
      worstSeverity: worst.severity,
    };
  }, [analyses, sortedAnalyses]);

  if (loadingPatient || loadingAnalyses) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold font-display">Patient not found</h2>
        <Link href="/patients">
          <Button variant="outline" className="mt-4 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Patients
          </Button>
        </Link>
      </div>
    );
  }

  const latestColor = stats.latestSeverity ? SEVERITY_COLORS[stats.latestSeverity as keyof typeof SEVERITY_COLORS] : "hsl(215,20%,55%)";
  const initials = patient.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Breadcrumbs + back */}
      <div className="flex items-center justify-between">
        <Link href="/patients" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Patients
        </Link>
        <div className="text-xs font-semibold text-muted-foreground tracking-widest uppercase hidden sm:block">
          Home / Patients / <span className="text-foreground">{patient.name}</span>
        </div>
      </div>

      {/* Patient Hero Card */}
      <Card className="rounded-2xl overflow-hidden relative border-0" style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        borderTop: `2px solid ${latestColor}`,
      }}>
        {/* Decorative glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 100% 0%, ${latestColor.replace(")", " / 0.1)")} 0%, transparent 60%)`,
        }} />
        <CardContent className="p-7 relative">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-display font-extrabold text-3xl flex-shrink-0 relative" style={{
              background: "linear-gradient(135deg, hsl(175 100% 38% / 0.25), hsl(220 90% 50% / 0.18))",
              border: "1px solid hsl(175 100% 38% / 0.4)",
              color: "hsl(175 100% 70%)",
            }}>
              {initials}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2" style={{
                background: latestColor,
                borderColor: "#f1f5f9",
              }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-3xl font-display font-extrabold text-foreground leading-tight">{patient.name}</h1>
                {stats.latestSeverity && <SeverityBadge severity={stats.latestSeverity} />}
              </div>
              <p className="text-xs font-mono text-muted-foreground tracking-wider mb-4">
                PATIENT ID: <span className="text-foreground">{String(patient.id).padStart(5, "0")}</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Demographics</p>
                    <p className="text-foreground font-medium">{patient.age} yrs • {patient.gender}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</p>
                    <p className="text-foreground font-medium truncate">{patient.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone</p>
                    <p className="text-foreground font-medium">{patient.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Registered</p>
                    <p className="text-foreground font-medium">{format(new Date(patient.createdAt), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link href="/upload">
              <Button className="rounded-xl h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25">
                <FileScan className="w-4 h-4 mr-2" /> New Scan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0" style={{ background: "#ffffff", borderTop: "2px solid hsl(175,100%,38%)" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Scans</p>
              <FileScan className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-display font-extrabold text-foreground">{stats.totalScans}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0" style={{ background: "#ffffff", borderTop: "2px solid hsl(142,71%,45%)" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Area</p>
              <Activity className="w-4 h-4" style={{ color: "hsl(142,71%,55%)" }} />
            </div>
            <p className="text-3xl font-display font-extrabold text-foreground">
              {stats.avgArea.toFixed(1)}<span className="text-sm text-muted-foreground font-sans ml-1">mm²</span>
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0" style={{ background: "#ffffff", borderTop: "2px solid hsl(43,96%,56%)" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Constriction</p>
              <TrendingDown className="w-4 h-4" style={{ color: "hsl(43,96%,65%)" }} />
            </div>
            <p className="text-3xl font-display font-extrabold text-foreground">
              {stats.avgConstriction.toFixed(1)}<span className="text-sm text-muted-foreground font-sans ml-1">%</span>
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0" style={{
          background: "#ffffff",
          borderTop: `2px solid ${stats.worstSeverity ? SEVERITY_COLORS[stats.worstSeverity as keyof typeof SEVERITY_COLORS] : "hsl(215,20%,40%)"}`,
        }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Worst Diagnosis</p>
              <AlertTriangle className="w-4 h-4" style={{ color: stats.worstSeverity ? SEVERITY_COLORS[stats.worstSeverity as keyof typeof SEVERITY_COLORS] : "hsl(215,20%,55%)" }} />
            </div>
            <p className="text-2xl font-display font-extrabold text-foreground">{stats.worstSeverity ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Constriction Timeline */}
      <Card className="glass-panel rounded-2xl" style={{ background: "#ffffff" }}>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Constriction Timeline
          </CardTitle>
          <p className="text-xs text-muted-foreground">Patient progression over time</p>
        </CardHeader>
        <CardContent className="h-[240px] pt-0">
          {timelineData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No scan history yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 16, right: 16, left: -24, bottom: 8 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(175,100%,50%)" />
                    <stop offset="100%" stopColor="hsl(220,100%,60%)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(215,20%,45%)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="hsl(215,20%,45%)" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<TimelineTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="constriction"
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    const c = SEVERITY_COLORS[payload.severity as keyof typeof SEVERITY_COLORS] ?? "hsl(175,100%,50%)";
                    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill={c} stroke="#fff" strokeWidth={2} />;
                  }}
                  activeDot={{ r: 7, fill: "hsl(175,100%,60%)", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Scan History Table */}
      <Card className="glass-panel rounded-2xl overflow-hidden" style={{ background: "#ffffff" }}>
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="font-display text-base font-bold">Scan History</CardTitle>
          <p className="text-xs text-muted-foreground">All analyses performed for this patient</p>
        </CardHeader>
        <CardContent className="p-0">
          {sortedAnalyses.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground text-sm">
              No scans recorded yet for this patient.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Severity</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Area mm²</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Volume mm³</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Constriction</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAnalyses.map((a, i) => (
                    <tr key={a.id} className="border-b border-border/20 hover:bg-white/[0.02] transition-colors"
                      style={{ background: i % 2 === 1 ? "rgba(255,255,255,0.012)" : undefined }}>
                      <td className="px-6 py-4 text-foreground">
                        <div className="font-semibold">{format(new Date(a.analyzedAt), "MMM d, yyyy")}</div>
                        <div className="text-[11px] text-muted-foreground">{format(new Date(a.analyzedAt), "h:mm a")}</div>
                      </td>
                      <td className="px-6 py-4"><SeverityBadge severity={a.severity} /></td>
                      <td className="px-6 py-4 font-mono text-foreground">{a.airwayArea.toFixed(1)}</td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">{a.airwayVolume.toFixed(0)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">{a.minConstriction.toFixed(1)}%</span>
                          <div className="flex-1 max-w-[80px] h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${Math.min(100, a.minConstriction)}%`,
                              background: SEVERITY_COLORS[a.severity as keyof typeof SEVERITY_COLORS],
                            }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateReport(a)}
                          className="rounded-lg h-8 px-3 text-xs font-semibold border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
