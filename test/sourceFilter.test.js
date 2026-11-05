import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../src/core/config.js";
import { scanProject } from "../src/core/pipeline.js";
import {
  isOversized,
  isPackedSource,
  partition,
} from "../src/ingest/sourceFilter.js";
import { MAX_SOURCE_BYTES } from "../src/core/constants.js";

test("isOversized uses the source size cap", () => {
  assert.equal(isOversized(MAX_SOURCE_BYTES), false);
  assert.equal(isOversized(MAX_SOURCE_BYTES + 1), true);
});

test("isPackedSource flags minified javascript and leaves formatted source", () => {
  const packed = `${"a".repeat(5000)};eval(userInput);`;
  const source = Array.from({ length: 80 }, (_, index) => `const n${index} = ${index};`).join(
    "\n",
  );
  assert.equal(isPackedSource(packed, "javascript"), true);
  assert.equal(isPackedSource(source, "javascript"), false);
  assert.equal(isPackedSource(packed, "python"), false);
});

test("partition splits by predicate without mutating input", () => {
  const items = [1, 2, 3, 4];
  assert.deepEqual(partition(items, (n) => n % 2 === 0), {
    yes: [2, 4],
    no: [1, 3],
  });
  assert.deepEqual(items, [1, 2, 3, 4]);
});

test("scanProject skips packed javascript and still scans source", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aletheia-packed-"));
  try {
    await writeFile(join(dir, "app.js"), "eval(userInput);\n", "utf8");
    await writeFile(
      join(dir, "BeSCYm_v.js"),
      `${"x".repeat(8000)};eval(userInput);`,
      "utf8",
    );
    await writeFile(join(dir, "huge.js"), "x".repeat(MAX_SOURCE_BYTES + 8), "utf8");
    const config = await loadConfig({
      cwd: dir,
      cliOverrides: { minSeverity: "low" },
    });
    const result = await scanProject({ target: dir, config });
    assert.equal(result.filesScanned, 1);
    assert.equal(result.filesSkipped, 2);
    assert.equal(
      result.findings.some((finding) => finding.file === "app.js"),
      true,
    );
    assert.equal(
      result.findings.some((finding) => finding.file === "BeSCYm_v.js"),
      false,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
