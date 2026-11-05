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
  ["sql-injection", "command-injection", "hardcoded-secret", "path-traversal"].forEach(
    (ruleId) => {
      assert.equal(ids.includes(ruleId), true, `missing ${ruleId}`);
    },
  );
  assert.equal(shouldFail(result.findings, "high"), true);
});
