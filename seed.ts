/**
 * Seed script: populates Neon DB with realistic OSA diagnostic sample data.
 * Run with: $env:DATABASE_URL="..."; npx tsx seed.ts
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./lib/db/src/schema/index.ts";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const { patientsTable, scansTable, analysesTable } = schema;

const recommendations = {
  Normal: "No airway constriction detected. Routine follow-up in 12 months recommended. Maintain current lifestyle habits.",
  Mild: "Mild airway narrowing observed. Lifestyle modifications advised including weight management and positional therapy. Follow-up in 6 months.",
  Moderate: "Moderate airway constriction identified. CPAP therapy evaluation recommended. Referral to sleep specialist advised. Follow-up in 3 months.",
  Severe: "Severe airway obstruction detected. Immediate clinical intervention required. Urgent referral to ENT and sleep medicine specialist. CPAP or surgical evaluation necessary.",
};

const patients = [
  { name: "James Harrison", age: 52, gender: "Male", email: "j.harrison@email.com", phone: "+1 (555) 234-5678" },
  { name: "Maria Chen", age: 44, gender: "Female", email: "m.chen@email.com", phone: "+1 (555) 876-5432" },
  { name: "Robert Alvarez", age: 61, gender: "Male", email: "r.alvarez@email.com", phone: "+1 (555) 345-6789" },
  { name: "Sarah Thompson", age: 38, gender: "Female", email: "s.thompson@email.com", phone: "+1 (555) 456-7890" },
  { name: "David Kim", age: 55, gender: "Male", email: "d.kim@email.com", phone: "+1 (555) 567-8901" },
  { name: "Emily Watson", age: 47, gender: "Female", email: "e.watson@email.com", phone: "+1 (555) 678-9012" },
  { name: "Michael Torres", age: 63, gender: "Male", email: null, phone: "+1 (555) 789-0123" },
  { name: "Linda Patel", age: 41, gender: "Female", email: "l.patel@email.com", phone: null },
  { name: "James Morrison", age: 58, gender: "Male", email: "j.morrison@email.com", phone: "+1 (555) 890-1234" },
  { name: "Aisha Okafor", age: 36, gender: "Female", email: "a.okafor@email.com", phone: "+1 (555) 901-2345" },
];

type Severity = "Normal" | "Mild" | "Moderate" | "Severe";

interface ScanData {
  severity: Severity;
  airwayArea: number;
  airwayVolume: number;
  minConstriction: number;
  daysAgo: number;
  filename: string;
}

const scansData: ScanData[][] = [
  // James Harrison – Moderate (multiple scans, worsening trend)
  [
    { severity: "Mild", airwayArea: 98.2, airwayVolume: 1670.4, minConstriction: 24.5, daysAgo: 180, filename: "harrison_j_scan_001.dcm" },
    { severity: "Moderate", airwayArea: 62.7, airwayVolume: 1003.2, minConstriction: 42.1, daysAgo: 60, filename: "harrison_j_scan_002.dcm" },
    { severity: "Moderate", airwayArea: 58.4, airwayVolume: 934.4, minConstriction: 48.3, daysAgo: 14, filename: "harrison_j_scan_003.dcm" },
  ],
  // Maria Chen – Normal (healthy)
  [
    { severity: "Normal", airwayArea: 142.6, airwayVolume: 2424.2, minConstriction: 8.2, daysAgo: 90, filename: "chen_m_scan_001.dcm" },
  ],
  // Robert Alvarez – Severe (critical case)
  [
    { severity: "Moderate", airwayArea: 55.1, airwayVolume: 882.0, minConstriction: 38.9, daysAgo: 365, filename: "alvarez_r_scan_001.dcm" },
    { severity: "Severe", airwayArea: 21.3, airwayVolume: 340.8, minConstriction: 74.2, daysAgo: 120, filename: "alvarez_r_scan_002.dcm" },
    { severity: "Severe", airwayArea: 18.7, airwayVolume: 299.2, minConstriction: 81.5, daysAgo: 30, filename: "alvarez_r_scan_003.dcm" },
  ],
  // Sarah Thompson – Mild
  [
    { severity: "Normal", airwayArea: 128.4, airwayVolume: 2054.4, minConstriction: 11.3, daysAgo: 200, filename: "thompson_s_scan_001.dcm" },
    { severity: "Mild", airwayArea: 85.6, airwayVolume: 1369.6, minConstriction: 27.8, daysAgo: 45, filename: "thompson_s_scan_002.dcm" },
  ],
  // David Kim – Severe
  [
    { severity: "Severe", airwayArea: 24.8, airwayVolume: 396.8, minConstriction: 77.6, daysAgo: 20, filename: "kim_d_scan_001.dcm" },
  ],
  // Emily Watson – Normal
  [
    { severity: "Normal", airwayArea: 158.3, airwayVolume: 2692.1, minConstriction: 5.9, daysAgo: 150, filename: "watson_e_scan_001.dcm" },
    { severity: "Normal", airwayArea: 161.7, airwayVolume: 2748.9, minConstriction: 4.7, daysAgo: 30, filename: "watson_e_scan_002.dcm" },
  ],
  // Michael Torres – Moderate
  [
    { severity: "Mild", airwayArea: 92.4, airwayVolume: 1478.4, minConstriction: 22.1, daysAgo: 270, filename: "torres_m_scan_001.dcm" },
    { severity: "Moderate", airwayArea: 67.8, airwayVolume: 1084.8, minConstriction: 39.4, daysAgo: 90, filename: "torres_m_scan_002.dcm" },
  ],
  // Linda Patel – Mild
  [
    { severity: "Mild", airwayArea: 82.3, airwayVolume: 1316.8, minConstriction: 31.2, daysAgo: 10, filename: "patel_l_scan_001.dcm" },
  ],
  // James Morrison – Severe (improving with treatment)
  [
    { severity: "Severe", airwayArea: 19.5, airwayVolume: 312.0, minConstriction: 83.7, daysAgo: 300, filename: "morrison_j_scan_001.dcm" },
    { severity: "Severe", airwayArea: 22.8, airwayVolume: 364.8, minConstriction: 76.4, daysAgo: 180, filename: "morrison_j_scan_002.dcm" },
    { severity: "Moderate", airwayArea: 48.6, airwayVolume: 777.6, minConstriction: 52.3, daysAgo: 60, filename: "morrison_j_scan_003.dcm" },
    { severity: "Moderate", airwayArea: 54.1, airwayVolume: 865.6, minConstriction: 44.8, daysAgo: 7, filename: "morrison_j_scan_004.dcm" },
  ],
  // Aisha Okafor – Normal
  [
    { severity: "Normal", airwayArea: 173.2, airwayVolume: 2943.4, minConstriction: 3.4, daysAgo: 5, filename: "okafor_a_scan_001.dcm" },
  ],
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Insert patients
  const insertedPatients = [];
  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    const [patient] = await db
      .insert(patientsTable)
      .values({
        name: p.name,
        age: p.age,
        gender: p.gender,
        email: p.email ?? undefined,
        phone: p.phone ?? undefined,
      })
      .returning();
    insertedPatients.push(patient);
    console.log(`  ✓ Patient: ${p.name}`);
  }

  // Insert scans + analyses
  for (let i = 0; i < insertedPatients.length; i++) {
    const patient = insertedPatients[i];
    const scanSet = scansData[i];

    for (const scan of scanSet) {
      const uploadedAt = new Date(Date.now() - scan.daysAgo * 24 * 60 * 60 * 1000);
      const analyzedAt = new Date(uploadedAt.getTime() + 15 * 60 * 1000); // 15 min after upload

      const [insertedScan] = await db
        .insert(scansTable)
        .values({
          patientId: patient.id,
          filename: scan.filename,
          status: "completed",
          uploadedAt,
        })
        .returning();

      await db.insert(analysesTable).values({
        scanId: insertedScan.id,
        patientId: patient.id,
        severity: scan.severity,
        airwayArea: scan.airwayArea,
        airwayVolume: scan.airwayVolume,
        minConstriction: scan.minConstriction,
        recommendation: recommendations[scan.severity],
        analyzedAt,
      });
    }
    console.log(`  ✓ ${scanSet.length} scan(s) for ${patient.name}`);
  }

  console.log("\n✅ Database seeded successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  pool.end();
  process.exit(1);
});
