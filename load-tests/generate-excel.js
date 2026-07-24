/**
 * generate-excel.js
 * =================
 * Reads the k6 JSON results file and produces a rich Excel workbook:
 *
 *   Sheet 1 – Summary          : overall test parameters + pass/fail
 *   Sheet 2 – Response Times   : avg / min / max / p(90) / p(95) / p(99)
 *   Sheet 3 – Endpoint Metrics : per-endpoint breakdown
 *   Sheet 4 – Thresholds       : pass/fail for every threshold
 *   Sheet 5 – Raw Metrics      : every metric that k6 emitted
 *
 * Usage:
 *   node load-tests/generate-excel.js [path-to-results.json] [output.xlsx]
 *
 * Defaults:
 *   input  → load-tests/results.json
 *   output → load-tests/load-test-report.xlsx
 */

import fs   from "fs";
import path from "path";
import ExcelJS from "exceljs";

// ─── CLI Args ─────────────────────────────────────────────────────────────────
const resultsFile = process.argv[2] || path.join("load-tests", "results.json");
const outputFile  = process.argv[3] || path.join("load-tests", "load-test-report.xlsx");

// ─── Load k6 JSON summary ─────────────────────────────────────────────────────
if (!fs.existsSync(resultsFile)) {
  console.error(`❌  Results file not found: ${resultsFile}`);
  console.error("    Run the load test first:  npm run load-test");
  process.exit(1);
}

const raw     = fs.readFileSync(resultsFile, "utf8");
const k6Data  = JSON.parse(raw);
const metrics = k6Data.metrics || {};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ms = (v) => (v == null ? "N/A" : `${Number(v).toFixed(2)} ms`);
const pct = (v) => (v == null ? "N/A" : `${(Number(v) * 100).toFixed(2)} %`);
const fmt = (v) => (v == null ? "N/A" : Number(v).toFixed(2));

function getMetric(name) {
  return metrics[name]?.values ?? null;
}

function trend(name) {
  const v = getMetric(name);
  if (!v) return null;
  return {
    avg: v.avg,
    min: v.min,
    max: v.max,
    med: v.med,
    p90: v["p(90)"],
    p95: v["p(95)"],
    p99: v["p(99)"],
    count: v.count,
  };
}

// ─── Style constants ──────────────────────────────────────────────────────────
const HEADER_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1A5276" },      // dark navy
};
const HEADER_FONT   = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
const PASS_FILL     = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E8449" } };
const FAIL_FILL     = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC0392B" } };
const STATUS_FONT   = { bold: true, color: { argb: "FFFFFFFF" } };
const ACCENT_FILL   = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E86C1" } };
const ALT_ROW_FILL  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD6EAF8" } };
const BORDER = {
  top:    { style: "thin" },
  left:   { style: "thin" },
  bottom: { style: "thin" },
  right:  { style: "thin" },
};

function styleHeader(row, cols) {
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    if (colNum <= cols) {
      cell.fill   = HEADER_FILL;
      cell.font   = HEADER_FONT;
      cell.border = BORDER;
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    }
  });
  row.height = 28;
}

function styleDataRow(row, altRow, cols) {
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    if (colNum <= cols) {
      if (altRow) cell.fill = ALT_ROW_FILL;
      cell.border    = BORDER;
      cell.alignment = { vertical: "middle", horizontal: "left" };
    }
  });
  row.height = 20;
}

// ─── Build Workbook ───────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator   = "OSA Diagnostic Load Tester";
wb.created   = new Date();
wb.modified  = new Date();

const now        = new Date().toLocaleString();
const httpDur    = trend("http_req_duration");
const iterDur    = trend("iteration_duration");
const httpReqs   = getMetric("http_reqs");
const checks     = getMetric("checks");
const vus        = getMetric("vus");
const errRate    = getMetric("error_rate");
const totalReqs  = getMetric("total_requests");

// ═══════════════════════════════════════════════════════════════════════════════
// Sheet 1 – Summary
// ═══════════════════════════════════════════════════════════════════════════════
{
  const ws = wb.addWorksheet("Summary", { properties: { tabColor: { argb: "FF1A5276" } } });
  ws.columns = [
    { width: 32 },
    { width: 30 },
  ];

  // Title
  ws.mergeCells("A1:B1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "OSA Diagnostic – Baseline Load Test Report";
  titleCell.font  = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF117864" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 38;

  const rows = [
    ["", ""],
    ["Test Configuration", ""],
    ["Virtual Users (VUs)", "100"],
    ["Duration", "1 minute"],
    ["Ramp-up", "None (flat load)"],
    ["Base URL", process.env.BASE_URL || "http://localhost:5000/api"],
    ["Report Generated", now],
    ["", ""],
    ["Overall Results", ""],
    ["Total HTTP Requests", httpReqs ? httpReqs.count : "N/A"],
    [
      "Requests per Second (RPS)",
      httpReqs ? `${Number(httpReqs.rate).toFixed(2)} req/s` : "N/A",
    ],
    ["Avg Response Time", ms(httpDur?.avg)],
    ["Min Response Time", ms(httpDur?.min)],
    ["Max Response Time", ms(httpDur?.max)],
    ["Median Response Time", ms(httpDur?.med)],
    ["p(90) Response Time", ms(httpDur?.p90)],
    ["p(95) Response Time", ms(httpDur?.p95)],
    ["p(99) Response Time", ms(httpDur?.p99)],
    ["", ""],
    ["Reliability", ""],
    ["Total Checks Run", checks ? checks.passes + checks.fails : "N/A"],
    ["Checks Passed", checks ? checks.passes : "N/A"],
    ["Checks Failed", checks ? checks.fails : "N/A"],
    ["Error Rate", errRate ? pct(errRate.rate) : "N/A"],
    ["Peak VUs", vus ? vus.max : "N/A"],
    ["", ""],
    ["Thresholds", ""],
    ["http_req_duration p(95)<2000ms", httpDur && httpDur.p95 < 2000 ? "PASS" : "FAIL"],
    ["http_req_duration p(99)<3000ms", httpDur && httpDur.p99 < 3000 ? "PASS" : "FAIL"],
    ["error_rate < 5%", errRate && errRate.rate < 0.05 ? "PASS" : "FAIL"],
    ["checks rate > 95%", checks && checks.rate > 0.95 ? "PASS" : "FAIL"],
  ];

  rows.forEach((r, i) => {
    const rowObj = ws.addRow(r);
    const rowIndex = i + 2;
    // Section headers
    if (r[0] === "Test Configuration" || r[0] === "Overall Results" ||
        r[0] === "Reliability"        || r[0] === "Thresholds") {
      ws.mergeCells(`A${rowIndex}:B${rowIndex}`);
      const cell = ws.getCell(`A${rowIndex}`);
      cell.fill      = ACCENT_FILL;
      cell.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.alignment = { vertical: "middle" };
      rowObj.height  = 24;
      return;
    }
    // Key column
    ws.getCell(`A${rowIndex}`).font   = { bold: true };
    ws.getCell(`A${rowIndex}`).border = BORDER;
    ws.getCell(`B${rowIndex}`).border = BORDER;

    // Colour PASS / FAIL cells
    const val = String(r[1]);
    if (val === "PASS") {
      ws.getCell(`B${rowIndex}`).fill  = PASS_FILL;
      ws.getCell(`B${rowIndex}`).font  = STATUS_FONT;
      ws.getCell(`B${rowIndex}`).alignment = { horizontal: "center" };
    } else if (val === "FAIL") {
      ws.getCell(`B${rowIndex}`).fill  = FAIL_FILL;
      ws.getCell(`B${rowIndex}`).font  = STATUS_FONT;
      ws.getCell(`B${rowIndex}`).alignment = { horizontal: "center" };
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sheet 2 – Response Times
// ═══════════════════════════════════════════════════════════════════════════════
{
  const ws = wb.addWorksheet("Response Times", { properties: { tabColor: { argb: "FF1E8449" } } });
  ws.columns = [
    { key: "metric", width: 28 },
    { key: "avg",    width: 16 },
    { key: "min",    width: 16 },
    { key: "max",    width: 16 },
    { key: "med",    width: 16 },
    { key: "p90",    width: 16 },
    { key: "p95",    width: 16 },
    { key: "p99",    width: 16 },
  ];

  ws.mergeCells("A1:H1");
  const t = ws.getCell("A1");
  t.value = "Response Time Breakdown (milliseconds)";
  t.font  = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  t.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E8449" } };
  t.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 34;

  const header = ws.addRow(["Metric", "Avg (ms)", "Min (ms)", "Max (ms)", "Median (ms)", "p(90) ms", "p(95) ms", "p(99) ms"]);
  styleHeader(header, 8);

  const endpointMetrics = [
    ["All HTTP Requests",           "http_req_duration"],
    ["Health  /healthz",            "health_duration"],
    ["Patients  /patients",         "patients_duration"],
    ["Patient  /patients/:id",      "patient_duration"],
    ["Scans  /scans",               "scans_duration"],
    ["Analyses  /analyses",         "analyses_duration"],
    ["Iteration Duration",          "iteration_duration"],
  ];

  endpointMetrics.forEach(([label, name], idx) => {
    const t = trend(name);
    const row = ws.addRow([
      label,
      t ? Number(t.avg).toFixed(2) : "N/A",
      t ? Number(t.min).toFixed(2) : "N/A",
      t ? Number(t.max).toFixed(2) : "N/A",
      t ? Number(t.med).toFixed(2) : "N/A",
      t ? Number(t.p90).toFixed(2) : "N/A",
      t ? Number(t.p95).toFixed(2) : "N/A",
      t ? Number(t.p99).toFixed(2) : "N/A",
    ]);
    styleDataRow(row, idx % 2 === 0, 8);
    row.getCell(1).font = { bold: true };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sheet 3 – Endpoint Metrics
// ═══════════════════════════════════════════════════════════════════════════════
{
  const ws = wb.addWorksheet("Endpoint Metrics", { properties: { tabColor: { argb: "FF7D6608" } } });
  ws.columns = [
    { key: "endpoint",  width: 32 },
    { key: "avg",       width: 14 },
    { key: "min",       width: 14 },
    { key: "max",       width: 14 },
    { key: "p95",       width: 14 },
    { key: "p99",       width: 14 },
    { key: "threshold", width: 20 },
    { key: "status",    width: 12 },
  ];

  ws.mergeCells("A1:H1");
  const t = ws.getCell("A1");
  t.value = "Per-Endpoint Performance Summary";
  t.font  = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  t.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7D6608" } };
  t.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 34;

  const hdr = ws.addRow(["Endpoint", "Avg (ms)", "Min (ms)", "Max (ms)", "p(95) ms", "p(99) ms", "Threshold", "Status"]);
  styleHeader(hdr, 8);

  const endpoints = [
    { label: "GET /healthz",        metric: "health_duration",   threshold: 500  },
    { label: "GET /patients",       metric: "patients_duration", threshold: 2000 },
    { label: "GET /patients/:id",   metric: "patient_duration",  threshold: 2000 },
    { label: "GET /scans",          metric: "scans_duration",    threshold: 2000 },
    { label: "GET /analyses",       metric: "analyses_duration", threshold: 2000 },
  ];

  endpoints.forEach((ep, idx) => {
    const t   = trend(ep.metric);
    const p95 = t ? Number(t.p95) : null;
    const pass = p95 !== null ? p95 < ep.threshold : null;
    const row = ws.addRow([
      ep.label,
      t ? Number(t.avg).toFixed(2) : "N/A",
      t ? Number(t.min).toFixed(2) : "N/A",
      t ? Number(t.max).toFixed(2) : "N/A",
      t ? Number(t.p95).toFixed(2) : "N/A",
      t ? Number(t.p99).toFixed(2) : "N/A",
      `p(95) < ${ep.threshold} ms`,
      pass === null ? "N/A" : pass ? "PASS" : "FAIL",
    ]);
    styleDataRow(row, idx % 2 === 0, 8);
    row.getCell(1).font = { bold: true };
    const statusCell = row.getCell(8);
    if (pass === true)       { statusCell.fill = PASS_FILL; statusCell.font = STATUS_FONT; statusCell.alignment = { horizontal: "center" }; }
    else if (pass === false) { statusCell.fill = FAIL_FILL; statusCell.font = STATUS_FONT; statusCell.alignment = { horizontal: "center" }; }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sheet 4 – Thresholds
// ═══════════════════════════════════════════════════════════════════════════════
{
  const ws = wb.addWorksheet("Thresholds", { properties: { tabColor: { argb: "FF7B241C" } } });
  ws.columns = [
    { key: "threshold", width: 40 },
    { key: "value",     width: 22 },
    { key: "limit",     width: 22 },
    { key: "status",    width: 12 },
  ];

  ws.mergeCells("A1:D1");
  const t = ws.getCell("A1");
  t.value = "Threshold Results";
  t.font  = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  t.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7B241C" } };
  t.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 34;

  const hdr = ws.addRow(["Threshold", "Actual Value", "Limit", "Status"]);
  styleHeader(hdr, 4);

  const thresholdRows = [
    {
      label: "http_req_duration p(95) < 2000 ms",
      actual: httpDur ? `${Number(httpDur.p95).toFixed(2)} ms` : "N/A",
      limit:  "< 2000 ms",
      pass:   httpDur ? httpDur.p95 < 2000 : null,
    },
    {
      label: "http_req_duration p(99) < 3000 ms",
      actual: httpDur ? `${Number(httpDur.p99).toFixed(2)} ms` : "N/A",
      limit:  "< 3000 ms",
      pass:   httpDur ? httpDur.p99 < 3000 : null,
    },
    {
      label: "health_duration p(95) < 500 ms",
      actual: trend("health_duration") ? `${Number(trend("health_duration").p95).toFixed(2)} ms` : "N/A",
      limit:  "< 500 ms",
      pass:   trend("health_duration") ? trend("health_duration").p95 < 500 : null,
    },
    {
      label: "patients_duration p(95) < 2000 ms",
      actual: trend("patients_duration") ? `${Number(trend("patients_duration").p95).toFixed(2)} ms` : "N/A",
      limit:  "< 2000 ms",
      pass:   trend("patients_duration") ? trend("patients_duration").p95 < 2000 : null,
    },
    {
      label: "scans_duration p(95) < 2000 ms",
      actual: trend("scans_duration") ? `${Number(trend("scans_duration").p95).toFixed(2)} ms` : "N/A",
      limit:  "< 2000 ms",
      pass:   trend("scans_duration") ? trend("scans_duration").p95 < 2000 : null,
    },
    {
      label: "analyses_duration p(95) < 2000 ms",
      actual: trend("analyses_duration") ? `${Number(trend("analyses_duration").p95).toFixed(2)} ms` : "N/A",
      limit:  "< 2000 ms",
      pass:   trend("analyses_duration") ? trend("analyses_duration").p95 < 2000 : null,
    },
    {
      label: "error_rate < 5%",
      actual: errRate ? pct(errRate.rate) : "N/A",
      limit:  "< 5%",
      pass:   errRate ? errRate.rate < 0.05 : null,
    },
    {
      label: "checks pass rate > 95%",
      actual: checks ? pct(checks.rate) : "N/A",
      limit:  "> 95%",
      pass:   checks ? checks.rate > 0.95 : null,
    },
  ];

  thresholdRows.forEach((t, idx) => {
    const row = ws.addRow([t.label, t.actual, t.limit, t.pass === null ? "N/A" : t.pass ? "PASS" : "FAIL"]);
    styleDataRow(row, idx % 2 === 0, 4);
    row.getCell(1).font = { bold: true };
    const sc = row.getCell(4);
    if (t.pass === true)       { sc.fill = PASS_FILL; sc.font = STATUS_FONT; sc.alignment = { horizontal: "center" }; }
    else if (t.pass === false) { sc.fill = FAIL_FILL; sc.font = STATUS_FONT; sc.alignment = { horizontal: "center" }; }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sheet 5 – Raw Metrics
// ═══════════════════════════════════════════════════════════════════════════════
{
  const ws = wb.addWorksheet("Raw Metrics", { properties: { tabColor: { argb: "FF5D6D7E" } } });
  ws.columns = [
    { key: "name",  width: 36 },
    { key: "type",  width: 14 },
    { key: "count", width: 14 },
    { key: "rate",  width: 16 },
    { key: "avg",   width: 16 },
    { key: "min",   width: 16 },
    { key: "max",   width: 16 },
    { key: "med",   width: 16 },
    { key: "p90",   width: 16 },
    { key: "p95",   width: 16 },
    { key: "p99",   width: 16 },
  ];

  ws.mergeCells("A1:K1");
  const t = ws.getCell("A1");
  t.value = "Raw k6 Metrics";
  t.font  = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  t.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5D6D7E" } };
  t.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 34;

  const hdr = ws.addRow([
    "Metric Name", "Type", "Count / Passes", "Rate",
    "Avg", "Min", "Max", "Median", "p(90)", "p(95)", "p(99)",
  ]);
  styleHeader(hdr, 11);

  Object.entries(metrics).forEach(([name, data], idx) => {
    const v    = data.values || {};
    const type = data.type   || "unknown";
    const row  = ws.addRow([
      name,
      type,
      v.count  != null ? v.count  : (v.passes != null ? v.passes : ""),
      v.rate   != null ? Number(v.rate  ).toFixed(4) : "",
      v.avg    != null ? Number(v.avg   ).toFixed(2) : "",
      v.min    != null ? Number(v.min   ).toFixed(2) : "",
      v.max    != null ? Number(v.max   ).toFixed(2) : "",
      v.med    != null ? Number(v.med   ).toFixed(2) : "",
      v["p(90)"] != null ? Number(v["p(90)"]).toFixed(2) : "",
      v["p(95)"] != null ? Number(v["p(95)"]).toFixed(2) : "",
      v["p(99)"] != null ? Number(v["p(99)"]).toFixed(2) : "",
    ]);
    styleDataRow(row, idx % 2 === 0, 11);
  });
}

// ─── Save ─────────────────────────────────────────────────────────────────────
await wb.xlsx.writeFile(outputFile);
console.log(`✅  Excel report saved to: ${outputFile}`);
console.log("    Open it in Microsoft Excel or LibreOffice Calc.");
