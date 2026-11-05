import assert from "node:assert/strict";
import test from "node:test";
import { renderReport } from "../src/report/index.js";

const result = {
  target: "/tmp/demo",
  scannedAt: "2026-11-05T00:00:00.000Z",
  filesScanned: 1,
  rulesApplied: 1,
  summary: { total: 1, critical: 1, high: 0, medium: 0, low: 0, info: 0 },
  findings: [
    {
      ruleId: "sql-injection",
      title: "Possible SQL injection via string concatenation",
      severity: "critical",
      cwe: "CWE-89",
      owasp: "A03:2021 Injection",
      message: "SQL is built from dynamic strings.",
      remediation: "Use parameterized queries.",
      file: "src/app.js",
      language: "javascript",
      line: 12,
      snippet: 'SELECT * FROM users WHERE name = \'" + req.query.name',
    },
  ],
};

test("json report includes findings", () => {
  const parsed = JSON.parse(renderReport(result, "json"));
  assert.equal(parsed.findings[0].ruleId, "sql-injection");
});

test("markdown report includes remediation", () => {
  const markdown = renderReport(result, "markdown");
  assert.equal(markdown.includes("Remediation"), true);
  assert.equal(markdown.includes("sql-injection"), true);
});

test("sarif report is version 2.1.0", () => {
  const sarif = JSON.parse(renderReport(result, "sarif"));
  assert.equal(sarif.version, "2.1.0");
  assert.equal(sarif.runs[0].results[0].ruleId, "sql-injection");
});
