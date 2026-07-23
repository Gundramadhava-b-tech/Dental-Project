import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").notNull(),
  patientId: integer("patient_id").notNull(),
  severity: text("severity").notNull(),
  airwayArea: real("airway_area").notNull(),
  airwayVolume: real("airway_volume").notNull(),
  minConstriction: real("min_constriction").notNull(),
  recommendation: text("recommendation").notNull(),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, analyzedAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
