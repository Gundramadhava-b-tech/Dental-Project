import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportAnalysis {
  id: number;
  scanId: number;
  patientId: number;
  patientName: string;
  severity: "Normal" | "Mild" | "Moderate" | "Severe";
  airwayArea: number;
  airwayVolume: number;
  minConstriction: number;
  recommendation: string;
  analyzedAt: string;
}

const SEVERITY_COLORS: Record<string, [number, number, number]> = {
  Normal: [34, 197, 94],
  Mild: [234, 179, 8],
  Moderate: [249, 115, 22],
  Severe: [239, 68, 68],
};

export function generateReport(analysis: ReportAnalysis) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;

  const analyzedDate = new Date(analysis.analyzedAt);
  const formattedDate = analyzedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = analyzedDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const severityColor = SEVERITY_COLORS[analysis.severity] ?? [100, 100, 100];

  doc.setFillColor(10, 20, 35);
  doc.rect(0, 0, pageW, 42, "F");

  doc.setFillColor(...severityColor);
  doc.rect(0, 42, pageW, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("OSA AIRWAY DIAGNOSTIC REPORT", margin, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 180, 200);
  doc.text("AeroDiag — OSA Analysis System  |  Confidential Medical Document", margin, 30);
  doc.text(`Generated: ${formattedDate} at ${formattedTime}`, margin, 37);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`REPORT #${String(analysis.id).padStart(5, "0")}`, pageW - margin, 20, { align: "right" });
  doc.text(`SCAN #${String(analysis.scanId).padStart(5, "0")}`, pageW - margin, 28, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 180, 200);
  doc.text("Reviewing Physician", pageW - margin, 37, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 220, 200);
  doc.text("Dr. Devika Pillai", pageW - margin, 42, { align: "right" });

  let y = 58;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 50, 70);
  doc.text("PATIENT INFORMATION", margin, y);

  doc.setDrawColor(220, 230, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 2, pageW - margin, y + 2);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 80, 100);
  doc.text("Patient Name:", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 30, 50);
  doc.text(analysis.patientName, margin + 38, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 80, 100);
  doc.text("Patient ID:", pageW / 2, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 30, 50);
  doc.text(`#${analysis.patientId}`, pageW / 2 + 28, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 80, 100);
  doc.text("Analysis Date:", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 30, 50);
  doc.text(`${formattedDate}`, margin + 38, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 80, 100);
  doc.text("Scan ID:", pageW / 2, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 30, 50);
  doc.text(`#${analysis.scanId}`, pageW / 2 + 28, y);

  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 50, 70);
  doc.text("SEVERITY ASSESSMENT", margin, y);
  doc.setDrawColor(220, 230, 240);
  doc.line(margin, y + 2, pageW - margin, y + 2);
  y += 10;

  const cardW = (pageW - margin * 2 - 6) / 2;

  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(210, 220, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, pageW - margin * 2, 26, 3, 3, "FD");

  doc.setFillColor(...severityColor);
  doc.roundedRect(margin + 4, y + 4, 60, 18, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(analysis.severity.toUpperCase(), margin + 34, y + 15, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 80, 100);
  const severityDescriptions: Record<string, string> = {
    Normal: "Airway cross-section is within expected clinical parameters. No significant constriction.",
    Mild: "Minor airway narrowing detected. Monitoring and lifestyle adjustments recommended.",
    Moderate: "Clinically significant constriction. Therapeutic intervention may be required.",
    Severe: "Critical airway obstruction. Immediate clinical evaluation and intervention required.",
  };
  const lines = doc.splitTextToSize(severityDescriptions[analysis.severity] ?? "", pageW - margin * 2 - 74);
  doc.text(lines, margin + 70, y + 10);

  y += 34;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 50, 70);
  doc.text("AIRWAY MEASUREMENTS", margin, y);
  doc.setDrawColor(220, 230, 240);
  doc.line(margin, y + 2, pageW - margin, y + 2);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Measurement", "Value", "Unit", "Reference Range", "Status"]],
    body: [
      [
        "Minimum Airway Area",
        analysis.airwayArea.toFixed(1),
        "mm²",
        "> 100 mm²",
        analysis.airwayArea > 100 ? "✓ Normal" : analysis.airwayArea > 50 ? "⚠ Below Normal" : "✗ Critical",
      ],
      [
        "Estimated Airway Volume",
        analysis.airwayVolume.toFixed(0),
        "mm³",
        "> 1500 mm³",
        analysis.airwayVolume > 1500 ? "✓ Normal" : analysis.airwayVolume > 800 ? "⚠ Reduced" : "✗ Critical",
      ],
      [
        "Minimum Constriction",
        `${analysis.minConstriction.toFixed(1)}%`,
        "%",
        "< 20%",
        analysis.minConstriction < 20 ? "✓ Normal" : analysis.minConstriction < 50 ? "⚠ Elevated" : "✗ Severe",
      ],
    ],
    headStyles: {
      fillColor: [10, 20, 35],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 60, 80],
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold" },
      4: {
        textColor: analysis.severity === "Normal" ? [34, 197, 94] : analysis.severity === "Mild" ? [161, 130, 0] : analysis.severity === "Moderate" ? [200, 90, 10] : [200, 50, 50],
        fontStyle: "bold",
      },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableLineColor: [210, 220, 235],
    tableLineWidth: 0.3,
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 50, 70);
  doc.text("CLINICAL RECOMMENDATION", margin, y);
  doc.setDrawColor(220, 230, 240);
  doc.line(margin, y + 2, pageW - margin, y + 2);
  y += 10;

  doc.setFillColor(...severityColor.map((c) => Math.min(255, c + 200)) as [number, number, number]);
  doc.setDrawColor(...severityColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, pageW - margin * 2, 1, 2, 2, "FD");

  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(210, 220, 235);
  doc.setLineWidth(0.3);
  const recText = doc.splitTextToSize(analysis.recommendation, pageW - margin * 2 - 12);
  const recH = recText.length * 5 + 10;
  doc.roundedRect(margin, y, pageW - margin * 2, recH, 2, 2, "FD");

  doc.setFillColor(...severityColor);
  doc.rect(margin, y, 4, recH, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 50, 70);
  doc.text(recText, margin + 10, y + 7);

  y += recH + 16;

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 50, 70);
  doc.text("CONSTRICTION SEVERITY SCALE", margin, y);
  doc.setDrawColor(220, 230, 240);
  doc.line(margin, y + 2, pageW - margin, y + 2);
  y += 10;

  const barW = pageW - margin * 2;
  const barH = 8;
  const gradient = [[34, 197, 94], [234, 179, 8], [249, 115, 22], [239, 68, 68]];
  const segW = barW / 4;
  gradient.forEach((color, i) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin + i * segW, y, segW, barH, "F");
  });

  const pct = Math.min(100, Math.max(0, analysis.minConstriction));
  const markerX = margin + (pct / 100) * barW;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(30, 50, 70);
  doc.setLineWidth(0.8);
  doc.triangle(markerX - 3, y - 1, markerX + 3, y - 1, markerX, y + 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60, 80, 100);
  doc.text("0%   Normal (0–20%)", margin, y + barH + 5);
  doc.text("Mild (20–35%)", margin + segW, y + barH + 5);
  doc.text("Moderate (35–60%)", margin + segW * 2, y + barH + 5);
  doc.text("Severe (60–100%)", margin + segW * 3, y + barH + 5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...severityColor);
  doc.text(`▲ ${analysis.minConstriction.toFixed(1)}%`, markerX, y - 5, { align: "center" });

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(10, 20, 35);
  doc.rect(0, pageH - 16, pageW, 16, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(140, 160, 180);
  doc.text(
    "This report is generated by the AeroDiag OSA Airway Diagnostic System. For clinical decisions, consult a licensed medical professional.",
    pageW / 2,
    pageH - 9,
    { align: "center" }
  );
  doc.text(
    `Reviewed & Authorized by: Dr. Devika Pillai  |  © ${new Date().getFullYear()} AeroDiag Medical Systems  |  Report ID: ${String(analysis.id).padStart(8, "0")}`,
    pageW / 2,
    pageH - 4,
    { align: "center" }
  );

  const safePatientName = analysis.patientName.replace(/\s+/g, "_");
  doc.save(`OSA_Report_${safePatientName}_${new Date(analysis.analyzedAt).toISOString().slice(0, 10)}.pdf`);
}
