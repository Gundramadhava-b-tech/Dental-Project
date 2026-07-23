import { Router, type IRouter } from "express";
import { db, patientsTable, scansTable, analysesTable } from "@workspace/db";
import { CreatePatientBody, GetPatientParams } from "@workspace/api-zod";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/patients", async (_req, res) => {
  try {
    const patients = await db.select().from(patientsTable).orderBy(patientsTable.createdAt);

    const scansCount = await db
      .select({
        patientId: scansTable.patientId,
        count: sql<number>`count(*)::int`,
      })
      .from(scansTable)
      .groupBy(scansTable.patientId);

    const latestSeverities = await db
      .select({
        patientId: analysesTable.patientId,
        severity: analysesTable.severity,
        analyzedAt: analysesTable.analyzedAt,
      })
      .from(analysesTable)
      .orderBy(analysesTable.analyzedAt);

    const scanCountMap = new Map(scansCount.map((s) => [s.patientId, s.count]));

    const severityMap = new Map<number, string>();
    for (const a of latestSeverities) {
      severityMap.set(a.patientId, a.severity);
    }

    const result = patients.map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      email: p.email ?? undefined,
      phone: p.phone ?? undefined,
      createdAt: p.createdAt.toISOString(),
      scanCount: scanCountMap.get(p.id) ?? 0,
      latestSeverity: severityMap.get(p.id) ?? null,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list patients" });
  }
});

router.post("/patients", async (req, res) => {
  try {
    const body = CreatePatientBody.parse(req.body);
    const [patient] = await db.insert(patientsTable).values(body).returning();
    res.status(201).json({
      ...patient,
      createdAt: patient.createdAt.toISOString(),
      scanCount: 0,
      latestSeverity: null,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid patient data" });
  }
});

router.get("/patients/:id", async (req, res) => {
  try {
    const { id } = GetPatientParams.parse({ id: Number(req.params.id) });
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
    if (!patient) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    const scanCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scansTable)
      .where(eq(scansTable.patientId, id));

    const latestAnalysis = await db
      .select({ severity: analysesTable.severity })
      .from(analysesTable)
      .where(eq(analysesTable.patientId, id))
      .orderBy(analysesTable.analyzedAt)
      .limit(1);

    res.json({
      ...patient,
      createdAt: patient.createdAt.toISOString(),
      scanCount: scanCount[0]?.count ?? 0,
      latestSeverity: latestAnalysis[0]?.severity ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get patient" });
  }
});

export default router;
