import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { scanProject } from "../src/core/pipeline.js";
import { loadConfig } from "../src/core/config.js";
import { shouldFail } from "../src/engine/score.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = join(root, "fixtures", "sample-web-service");

test("scanProject reports expected issues in the sample service", async () => {
  const config = await loadConfig({
    cwd: root,
    cliOverrides: { minSeverity: "low", failOn: "high" },
  });
  const result = await scanProject({ target: fixture, config });
  const ids = [...new Set(result.findings.map((finding) => finding.ruleId))];

  assert.equal(result.filesScanned >= 3, true);
  assert.equal(result.filesSkipped, 0);
  assert.equal(typeof result.durationMs, "number");
  assert.equal(
    result.findings.some((finding) => finding.file.includes(".output")),
    false,
  );
  ["sql-injection", "command-injection", "hardcoded-secret", "path-traversal"].forEach(
    (ruleId) => {
      assert.equal(ids.includes(ruleId), true, `missing ${ruleId}`);
    },
  );
  assert.equal(shouldFail(result.findings, "high"), true);
});

test("self-scan skips sample fixtures, tests, and rule regex literals", async () => {
  const config = await loadConfig({ cwd: root });
  const result = await scanProject({ target: root, config });
  const noisy = result.findings.filter((finding) =>
    /^(fixtures|test)\//.test(finding.file) || finding.file.endsWith("rules/catalog.js"),
  );

  assert.equal(noisy.length, 0);
});

test("scanProject emits progress stages", async () => {
  const config = await loadConfig({
    cwd: root,
    cliOverrides: { minSeverity: "low" },
  });
  const events = [];
  await scanProject({
    target: fixture,
    config,
    onProgress: (event) => {
      events.push(event);
    },
  });

  const types = events.map((event) => event.type);
  assert.deepEqual(
    types.filter((type) => type !== "match:item"),
    [
      "scan:start",
      "collect:start",
      "collect:done",
      "read:start",
      "read:done",
      "scan:skip",
      "match:start",
      "match:done",
      "scan:done",
    ],
  );
  assert.equal(
    events.some((event) => event.type === "match:item" && event.file),
    true,
  );
  const collected = events.find((event) => event.type === "collect:done");
  assert.equal(collected.total >= 3, true);
  assert.equal(collected.languageCounts.javascript > 0, true);
});
