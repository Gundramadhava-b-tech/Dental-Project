import { Router, type IRouter } from "express";
import { db, patientsTable, scansTable, analysesTable } from "@workspace/db";
import { ListAnalysesQueryParams } from "@workspace/api-zod";
import { eq, sql, desc, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/analyses", async (req, res) => {
  try {
    const physicianId = req.headers["x-physician-id"] as string | undefined;
    if (!physicianId) {
      res.status(401).json({ error: "Missing x-physician-id header" });
      return;
    }

    const physicianPatients = await db
      .select({ id: patientsTable.id })
      .from(patientsTable)
      .where(eq(patientsTable.physicianId, physicianId));
    
    if (physicianPatients.length === 0) {
      res.json([]);
      return;
    }

    const allowedPatientIds = physicianPatients.map(p => p.id);

    const query = ListAnalysesQueryParams.parse(req.query);

    let analysesRaw = await db
      .select()
      .from(analysesTable)
      .where(inArray(analysesTable.patientId, allowedPatientIds))
      .orderBy(desc(analysesTable.analyzedAt));
    
    let analyses = analysesRaw;

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

router.get("/stats", async (req, res) => {
  try {
    const physicianId = req.headers["x-physician-id"] as string | undefined;
    if (!physicianId) {
      res.status(401).json({ error: "Missing x-physician-id header" });
      return;
    }

    const physicianPatients = await db
      .select({ id: patientsTable.id })
      .from(patientsTable)
      .where(eq(patientsTable.physicianId, physicianId));
    
    if (physicianPatients.length === 0) {
      res.json({
        totalPatients: 0,
        totalScans: 0,
        severityDistribution: { Normal: 0, Mild: 0, Moderate: 0, Severe: 0 },
        recentAnalyses: [],
        avgAirwayArea: 0,
        monthlyScans: [],
      });
      return;
    }

    const allowedPatientIds = physicianPatients.map(p => p.id);

    const totalPatients = physicianPatients.length;
    
    const totalScansResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(scansTable)
      .where(inArray(scansTable.patientId, allowedPatientIds));
    const totalScansCount = totalScansResult[0]?.count ?? 0;

    const severityCounts = await db
      .select({
        severity: analysesTable.severity,
        count: sql<number>`count(*)::int`,
      })
      .from(analysesTable)
      .where(inArray(analysesTable.patientId, allowedPatientIds))
      .groupBy(analysesTable.severity);

    const severityDistribution = { Normal: 0, Mild: 0, Moderate: 0, Severe: 0 };
    for (const { severity, count } of severityCounts) {
      if (severity in severityDistribution) {
        severityDistribution[severity as keyof typeof severityDistribution] = count;
      }
    }

    const avgAreaResult = await db
      .select({ avg: sql<number>`avg(airway_area)::real` })
      .from(analysesTable)
      .where(inArray(analysesTable.patientId, allowedPatientIds));

    const recentAnalysesRaw = await db
      .select()
      .from(analysesTable)
      .where(inArray(analysesTable.patientId, allowedPatientIds))
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
      .where(inArray(scansTable.patientId, allowedPatientIds))
      .groupBy(sql`to_char(uploaded_at, 'Mon YYYY')`)
      .orderBy(sql`min(uploaded_at)`);

    res.json({
      totalPatients: totalPatients,
      totalScans: totalScansCount,
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
