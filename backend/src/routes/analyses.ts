import { Router, type IRouter } from "express";
import { db, patientsTable, scansTable, analysesTable } from "@workspace/db";
import { ListAnalysesQueryParams } from "@workspace/api-zod";
import { eq, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/analyses", async (req, res) => {
  try {
    const query = ListAnalysesQueryParams.parse(req.query);

    let analyses = await db
      .select()
      .from(analysesTable)
      .orderBy(desc(analysesTable.analyzedAt));

    if (query.patientId) {
      analyses = analyses.filter((a) => a.patientId === query.patientId);
    }
    if (query.severity) {
      analyses = analyses.filter((a) => a.severity === query.severity);
    }

    const patientIds = [...new Set(analyses.map((a) => a.patientId))];
    const patients = patientIds.length > 0 ? await db.select().from(patientsTable) : [];
    const patientMap = new Map(patients.map((p) => [p.id, p.name]));

    const result = analyses.map((a) => ({
      id: a.id,
      scanId: a.scanId,
      patientId: a.patientId,
      patientName: patientMap.get(a.patientId) ?? "Unknown",
      severity: a.severity as "Normal" | "Mild" | "Moderate" | "Severe",
      airwayArea: a.airwayArea,
      airwayVolume: a.airwayVolume,
      minConstriction: a.minConstriction,
      recommendation: a.recommendation,
      analyzedAt: a.analyzedAt.toISOString(),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list analyses" });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const totalPatients = await db.select({ count: sql<number>`count(*)::int` }).from(patientsTable);
    const totalScans = await db.select({ count: sql<number>`count(*)::int` }).from(scansTable);

    const severityCounts = await db
      .select({
        severity: analysesTable.severity,
        count: sql<number>`count(*)::int`,
      })
      .from(analysesTable)
      .groupBy(analysesTable.severity);

    const severityDistribution = { Normal: 0, Mild: 0, Moderate: 0, Severe: 0 };
    for (const { severity, count } of severityCounts) {
      if (severity in severityDistribution) {
        severityDistribution[severity as keyof typeof severityDistribution] = count;
      }
    }

    const avgAreaResult = await db
      .select({ avg: sql<number>`avg(airway_area)::real` })
      .from(analysesTable);

    const recentAnalysesRaw = await db
      .select()
      .from(analysesTable)
      .orderBy(desc(analysesTable.analyzedAt))
      .limit(5);

    const patients = await db.select().from(patientsTable);
    const patientMap = new Map(patients.map((p) => [p.id, p.name]));

    const recentAnalyses = recentAnalysesRaw.map((a) => ({
      id: a.id,
      scanId: a.scanId,
      patientId: a.patientId,
      patientName: patientMap.get(a.patientId) ?? "Unknown",
      severity: a.severity as "Normal" | "Mild" | "Moderate" | "Severe",
      airwayArea: a.airwayArea,
      airwayVolume: a.airwayVolume,
      minConstriction: a.minConstriction,
      recommendation: a.recommendation,
      analyzedAt: a.analyzedAt.toISOString(),
    }));

    const monthlyScansRaw = await db
      .select({
        month: sql<string>`to_char(uploaded_at, 'Mon YYYY')`,
        count: sql<number>`count(*)::int`,
      })
      .from(scansTable)
      .groupBy(sql`to_char(uploaded_at, 'Mon YYYY')`)
      .orderBy(sql`min(uploaded_at)`);

    res.json({
      totalPatients: totalPatients[0]?.count ?? 0,
      totalScans: totalScans[0]?.count ?? 0,
      severityDistribution,
      recentAnalyses,
      avgAirwayArea: Math.round((avgAreaResult[0]?.avg ?? 0) * 10) / 10,
      monthlyScans: monthlyScansRaw,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
