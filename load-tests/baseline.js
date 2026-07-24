/**
 * OSA Diagnostic – Baseline / Load Test
 * ======================================
 * Tool : k6  (https://k6.io)
 * Goal : 100 virtual users, 1 minute continuous load
 *
 * Endpoints tested:
 *   GET  /api/healthz
 *   GET  /api/patients
 *   GET  /api/patients/:id
 *   GET  /api/scans
 *   GET  /api/analyses
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// ─── Custom Metrics ───────────────────────────────────────────────────────────
const healthTrend    = new Trend("health_duration",    true);
const patientsTrend  = new Trend("patients_duration",  true);
const patientTrend   = new Trend("patient_duration",   true);
const scansTrend     = new Trend("scans_duration",     true);
const analysesTrend  = new Trend("analyses_duration",  true);

const errorRate   = new Rate("error_rate");
const totalReqs   = new Counter("total_requests");

// ─── Configuration ────────────────────────────────────────────────────────────
// BASE_URL: override via  k6 run --env BASE_URL=http://... baseline.js
const BASE_URL     = __ENV.BASE_URL     || "http://localhost:5000/api";
const PHYSICIAN_ID = __ENV.PHYSICIAN_ID || "test-physician-load";

/** k6 test options: 100 VUs running for exactly 1 minute */
export const options = {
  vus:      100,
  duration: "1m",

  // Performance thresholds – fail the test if these are violated
  thresholds: {
    // Overall HTTP request duration
    "http_req_duration":          ["p(95)<2000", "p(99)<3000"],
    // Endpoint-specific
    "health_duration":            ["p(95)<500"],
    "patients_duration":          ["p(95)<2000"],
    "patient_duration":           ["p(95)<2000"],
    "scans_duration":             ["p(95)<2000"],
    "analyses_duration":          ["p(95)<2000"],
    // Error rate must stay below 5 %
    "error_rate":                 ["rate<0.05"],
    // All checks must pass at least 95 % of the time
    "checks":                     ["rate>0.95"],
  },
};

// ─── Shared Headers ───────────────────────────────────────────────────────────
const HEADERS = {
  "Content-Type":   "application/json",
  "x-physician-id": PHYSICIAN_ID,
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function request(method, url, body, tag) {
  const params = { headers: HEADERS, tags: { name: tag } };
  const res = method === "GET"
    ? http.get(url, params)
    : http.post(url, JSON.stringify(body), params);
  totalReqs.add(1);
  return res;
}

// ─── Default (main) function – executed by every VU ──────────────────────────
export default function () {

  // 1. Health check
  {
    const res = request("GET", `${BASE_URL}/healthz`, null, "GET /healthz");
    healthTrend.add(res.timings.duration);
    const ok = check(res, {
      "healthz 200":  (r) => r.status === 200,
      "healthz body": (r) => {
        try { return JSON.parse(r.body).status === "ok"; } catch { return false; }
      },
    });
    errorRate.add(!ok);
  }

  sleep(0.3);

  // 2. List patients
  let firstPatientId = null;
  {
    const res = request("GET", `${BASE_URL}/patients`, null, "GET /patients");
    patientsTrend.add(res.timings.duration);
    const ok = check(res, {
      "patients 200":   (r) => r.status === 200,
      "patients array": (r) => {
        try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
      },
    });
    errorRate.add(!ok);
    try {
      const arr = JSON.parse(res.body);
      if (arr.length > 0) firstPatientId = arr[0].id;
    } catch (_) { }
  }

  sleep(0.3);

  // 3. Get single patient (if we found one)
  if (firstPatientId !== null) {
    const res = request("GET", `${BASE_URL}/patients/${firstPatientId}`, null, "GET /patients/:id");
    patientTrend.add(res.timings.duration);
    const ok = check(res, {
      "patient id 200": (r) => r.status === 200,
      "patient id ok":  (r) => {
        try { return JSON.parse(r.body).id === firstPatientId; } catch { return false; }
      },
    });
    errorRate.add(!ok);
  }

  sleep(0.3);

  // 4. List scans
  {
    const res = request("GET", `${BASE_URL}/scans`, null, "GET /scans");
    scansTrend.add(res.timings.duration);
    const ok = check(res, {
      "scans 200":   (r) => r.status === 200,
      "scans array": (r) => {
        try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
      },
    });
    errorRate.add(!ok);
  }

  sleep(0.3);

  // 5. List analyses
  {
    const res = request("GET", `${BASE_URL}/analyses`, null, "GET /analyses");
    analysesTrend.add(res.timings.duration);
    const ok = check(res, {
      "analyses 200":   (r) => r.status === 200,
      "analyses array": (r) => {
        try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
      },
    });
    errorRate.add(!ok);
  }

  sleep(0.3);
}
