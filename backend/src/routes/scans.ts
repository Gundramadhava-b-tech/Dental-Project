import { Router, type IRouter } from "express";
import { db, patientsTable, scansTable, analysesTable } from "@workspace/db";
import { CreateScanBody, GetScanParams, ListScansQueryParams } from "@workspace/api-zod";
import { eq, sql, inArray } from "drizzle-orm";
import { analyzeAirway } from "../lib/analyzer.js";

const router: IRouter = Router();

async function buildScanResponse(scan: typeof scansTable.$inferSelect, patientName: string) {
  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.scanId, scan.id))
    .limit(1);

  const analysisData = analysis
    ? {
        id: analysis.id,
        scanId: analysis.scanId,
        patientId: analysis.patientId,
        patientName,
        severity: analysis.severity as "Normal" | "Mild" | "Moderate" | "Severe",
        airwayArea: analysis.airwayArea,
        airwayVolume: analysis.airwayVolume,
        minConstriction: analysis.minConstriction,
        recommendation: analysis.recommendation,
        analyzedAt: analysis.analyzedAt.toISOString(),
      }
    : null;

  return {
    id: scan.id,
    patientId: scan.patientId,
    patientName,
    filename: scan.filename,
    uploadedAt: scan.uploadedAt.toISOString(),
    status: scan.status as "processing" | "completed" | "failed",
    analysis: analysisData,
  };
}

router.get("/scans", async (req, res) => {
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

    const query = ListScansQueryParams.parse(req.query);
    let scansRaw = await db.select().from(scansTable).where(inArray(scansTable.patientId, allowedPatientIds)).orderBy(scansTable.uploadedAt);
    let scans = scansRaw;
    if (query.patientId) {
      scans = scans.filter((s) => s.patientId === query.patientId);
    }

    const patientIds = [...new Set(scans.map((s) => s.patientId))];
    const patients = patientIds.length > 0
      ? await db.select().from(patientsTable)
      : [];
    const patientMap = new Map(patients.map((p) => [p.id, p.name]));

    const results = await Promise.all(
      scans.map((scan) => buildScanResponse(scan, patientMap.get(scan.patientId) ?? "Unknown"))
    );

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list scans" });
  }
});

router.post("/scans", async (req, res) => {
  try {
    const physicianId = req.headers["x-physician-id"] as string | undefined;
    if (!physicianId) {
      res.status(401).json({ error: "Missing x-physician-id header" });
      return;
    }
    const body = CreateScanBody.parse(req.body);

    const [patient] = await db.select().from(patientsTable).where(sql`${patientsTable.id} = ${body.patientId} AND ${patientsTable.physicianId} = ${physicianId}`);
    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    const [scan] = await db.insert(scansTable).values({
      patientId: body.patientId,
      filename: body.filename,
      status: "processing",
    }).returning();

    const result = analyzeAirway(body.filename);

    const [analysis] = await db.insert(analysesTable).values({
      scanId: scan.id,
      patientId: body.patientId,
      severity: result.severity,
      airwayArea: result.airwayArea,
      airwayVolume: result.airwayVolume,
      minConstriction: result.minConstriction,
      recommendation: result.recommendation,
    }).returning();

    await db.update(scansTable).set({ status: "completed" }).where(eq(scansTable.id, scan.id));

    res.status(201).json({
      id: scan.id,
      patientId: scan.patientId,
      patientName: patient.name,
      filename: scan.filename,
      uploadedAt: scan.uploadedAt.toISOString(),
      status: "completed" as const,
      analysis: {
        id: analysis.id,
        scanId: analysis.scanId,
        patientId: analysis.patientId,
        patientName: patient.name,
        severity: analysis.severity,
        airwayArea: analysis.airwayArea,
        airwayVolume: analysis.airwayVolume,
        minConstriction: analysis.minConstriction,
        recommendation: analysis.recommendation,
        analyzedAt: analysis.analyzedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create scan" });
  }
});

router.get("/scans/:id", async (req, res) => {
  try {
    const physicianId = req.headers["x-physician-id"] as string | undefined;
    if (!physicianId) {
      res.status(401).json({ error: "Missing x-physician-id header" });
      return;
    }
    const { id } = GetScanParams.parse({ id: Number(req.params.id) });
    const [scan] = await db.select().from(scansTable).where(eq(scansTable.id, id));
    if (!scan) {
      res.status(404).json({ error: "Scan not found" });
      return;
    }

    const [patient] = await db.select().from(patientsTable).where(sql`${patientsTable.id} = ${scan.patientId} AND ${patientsTable.physicianId} = ${physicianId}`);
    if (!patient) {
      res.status(404).json({ error: "Scan not found" });
      return;
    }
    const response = await buildScanResponse(scan, patient?.name ?? "Unknown");
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get scan" });
  }
});

export default router;
