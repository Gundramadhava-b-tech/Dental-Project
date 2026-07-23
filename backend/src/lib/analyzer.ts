export type SeverityLevel = "Normal" | "Mild" | "Moderate" | "Severe";

interface AnalysisResult {
  severity: SeverityLevel;
  airwayArea: number;
  airwayVolume: number;
  minConstriction: number;
  recommendation: string;
}

const recommendations: Record<SeverityLevel, string> = {
  Normal:
    "No airway constriction detected. Routine follow-up in 12 months recommended. Maintain current lifestyle habits.",
  Mild:
    "Mild airway narrowing observed. Lifestyle modifications advised including weight management and positional therapy. Follow-up in 6 months.",
  Moderate:
    "Moderate airway constriction identified. CPAP therapy evaluation recommended. Referral to sleep specialist advised. Follow-up in 3 months.",
  Severe:
    "Severe airway obstruction detected. Immediate clinical intervention required. Urgent referral to ENT and sleep medicine specialist. CPAP or surgical evaluation necessary.",
};

export function analyzeAirway(filename: string): AnalysisResult {
  const hash = filename.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const seed = (hash * 1234567) % 10000;

  const rand = (min: number, max: number, offset = 0): number => {
    const r = ((seed + offset) * 9301 + 49297) % 233280;
    return min + (r / 233280) * (max - min);
  };

  const severityRoll = rand(0, 100, 0);
  let severity: SeverityLevel;
  let airwayArea: number;
  let minConstriction: number;

  if (severityRoll < 35) {
    severity = "Normal";
    airwayArea = rand(110, 180, 1);
    minConstriction = rand(0, 15, 2);
  } else if (severityRoll < 60) {
    severity = "Mild";
    airwayArea = rand(70, 110, 1);
    minConstriction = rand(15, 35, 2);
  } else if (severityRoll < 80) {
    severity = "Moderate";
    airwayArea = rand(35, 70, 1);
    minConstriction = rand(35, 60, 2);
  } else {
    severity = "Severe";
    airwayArea = rand(10, 35, 1);
    minConstriction = rand(60, 90, 2);
  }

  const airwayVolume = airwayArea * rand(12, 20, 3);

  return {
    severity,
    airwayArea: Math.round(airwayArea * 10) / 10,
    airwayVolume: Math.round(airwayVolume * 10) / 10,
    minConstriction: Math.round(minConstriction * 10) / 10,
    recommendation: recommendations[severity],
  };
}
