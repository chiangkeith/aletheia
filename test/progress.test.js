import assert from "node:assert/strict";
import test from "node:test";
import { createProgressReporter, formatProgress } from "../src/cli/progress.js";
import {
  PROGRESS,
  countByLanguage,
  describeRuleSelection,
  formatDuration,
  formatFindingCounts,
  formatLanguageCounts,
  formatSkipCounts,
} from "../src/core/progress.js";

test("countByLanguage tallies files without mutating input", () => {
  const files = [
    { language: "javascript" },
    { language: "python" },
    { language: "javascript" },
  ];
  assert.deepEqual(countByLanguage(files), { javascript: 2, python: 1 });
  assert.equal(files.length, 3);
});

test("format helpers describe counts and duration", () => {
  assert.equal(
    formatLanguageCounts({ python: 1, javascript: 2 }),
    "javascript=2, python=1",
  );
  assert.equal(
    formatFindingCounts({
      total: 3,
      critical: 1,
      high: 2,
      medium: 0,
      low: 0,
      info: 0,
    }),
    "critical=1, high=2",
  );
  assert.equal(formatDuration(12), "12ms");
  assert.equal(formatDuration(1840), "1.84s");
  assert.equal(describeRuleSelection({ enable: [], disable: [] }), "all built-in");
  assert.equal(
    describeRuleSelection({ enable: [], disable: ["xxe"] }),
    "all except xxe",
  );
  assert.equal(
    describeRuleSelection({ enable: ["sql-injection"], disable: [] }),
    "sql-injection",
  );
  assert.equal(
    formatSkipCounts({ packed: 3, oversized: 1 }),
    "packed=3, oversized=1",
  );
});

test("formatProgress renders scan stages for the terminal", () => {
  const start = formatProgress({
    type: PROGRESS.start,
    target: "/tmp/service",
    configPath: "/tmp/aletheia.config.json",
    languages: ["javascript", "python"],
    rules: { enable: [], disable: [] },
    minSeverity: "info",
    failOn: "high",
  });
  assert.equal(start.includes("target       /tmp/service"), true);
  assert.equal(start.includes("rules        all built-in"), true);

  assert.equal(
    formatProgress({
      type: PROGRESS.collectDone,
      total: 3,
      languageCounts: { javascript: 2, python: 1 },
    }),
    "  3 files (javascript=2, python=1)",
  );
  assert.equal(
    formatProgress({ type: PROGRESS.collectDone, total: 0, languageCounts: {} }),
    "  0 files matched the include/exclude filters",
  );
  assert.equal(formatProgress({ type: PROGRESS.readStart, total: 0 }), null);
  assert.equal(formatProgress({ type: PROGRESS.skip, total: 0 }), null);
  assert.equal(
    formatProgress({
      type: PROGRESS.skip,
      total: 4,
      packed: 3,
      oversized: 1,
    }),
    "  skipped 4 packed or oversized files (packed=3, oversized=1)",
  );
  assert.equal(
    formatProgress({
      type: PROGRESS.matchItem,
      current: 2,
      total: 10,
      file: "src/app.js",
    }),
    "   2/10  src/app.js",
  );
  assert.equal(
    formatProgress({
      type: PROGRESS.done,
      durationMs: 840,
      summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    }),
    "Done in 840ms — no findings above threshold\n",
  );
});

const memoryStream = () => {
  const chunks = [];
  return {
    write: (chunk) => {
      chunks.push(chunk);
      return true;
    },
    output: () => chunks.join(""),
  };
};

test("quiet reporter writes nothing", () => {
  const stream = memoryStream();
  const reporter = createProgressReporter({ stream, quiet: true, isTTY: true });
  reporter.onProgress({ type: PROGRESS.collectStart });
  reporter.finish();
  assert.equal(stream.output(), "");
});

test("non-TTY reporter prints stages but not each file", () => {
  const stream = memoryStream();
  const reporter = createProgressReporter({ stream, isTTY: false });
  reporter.onProgress({ type: PROGRESS.collectStart });
  reporter.onProgress({
    type: PROGRESS.matchItem,
    current: 1,
    total: 2,
    file: "a.js",
  });
  reporter.onProgress({
    type: PROGRESS.done,
    durationMs: 20,
    summary: { total: 1, critical: 0, high: 1, medium: 0, low: 0, info: 0 },
  });
  const output = stream.output();
  assert.equal(output.includes("Collecting source files..."), true);
  assert.equal(output.includes("a.js"), false);
  assert.equal(output.includes("1 findings (high=1)"), true);
});

test("TTY reporter overwrites the current file line", () => {
  const stream = memoryStream();
  const reporter = createProgressReporter({ stream, isTTY: true });
  reporter.onProgress({
    type: PROGRESS.matchItem,
    current: 1,
    total: 2,
    file: "a.js",
  });
  reporter.onProgress({
    type: PROGRESS.matchItem,
    current: 2,
    total: 2,
    file: "b.js",
  });
  reporter.finish();
  const output = stream.output();
  assert.equal(output.includes("\r\x1b[2K  1/2  a.js"), true);
  assert.equal(output.includes("\r\x1b[2K  2/2  b.js"), true);
});

test("verbose reporter lists every file even without a TTY", () => {
  const stream = memoryStream();
  const reporter = createProgressReporter({
    stream,
    isTTY: false,
    verbose: true,
  });
  reporter.onProgress({
    type: PROGRESS.matchItem,
    current: 1,
    total: 1,
    file: "src/app.js",
  });
  reporter.onProgress({
    type: PROGRESS.skip,
    total: 1,
    packed: 1,
    oversized: 0,
    files: [{ file: "BeSCYm_v.js", reason: "packed" }],
  });
  assert.equal(stream.output().includes("src/app.js"), true);
  assert.equal(stream.output().includes("skip  BeSCYm_v.js (packed)"), true);
});
