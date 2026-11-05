import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "bin", "aletheia.js");
const fixture = join(root, "fixtures", "sample-web-service");

const runScan = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn("node", [bin, "scan", ...args], { cwd: root });
    const chunks = { stdout: [], stderr: [] };
    child.stdout.on("data", (chunk) => {
      chunks.stdout = [...chunks.stdout, chunk.toString()];
    });
    child.stderr.on("data", (chunk) => {
      chunks.stderr = [...chunks.stderr, chunk.toString()];
    });
    child.on("error", reject);
    child.on("close", (code) =>
      resolve({
        code,
        stdout: chunks.stdout.join(""),
        stderr: chunks.stderr.join(""),
      }),
    );
  });

test("scan prints progress on stderr and keeps JSON stdout parseable", async () => {
  const { code, stdout, stderr } = await runScan([
    fixture,
    "--format",
    "json",
    "--min-severity",
    "low",
  ]);

  assert.equal(code, 2);
  assert.equal(stderr.includes("Collecting source files..."), true);
  assert.equal(stderr.includes("Applying"), true);
  assert.equal(stderr.includes("Done in"), true);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.filesScanned >= 3, true);
  assert.equal(typeof parsed.durationMs, "number");
});

test("scan --quiet hides progress", async () => {
  const { stderr, stdout } = await runScan([
    fixture,
    "--quiet",
    "--format",
    "json",
    "--min-severity",
    "low",
  ]);

  assert.equal(stderr.includes("Collecting source files..."), false);
  assert.equal(JSON.parse(stdout).filesScanned >= 3, true);
});

test("scan --output creates directories and infers markdown from .md", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aletheia-cli-out-"));
  const output = join(dir, "reports", "aletheia.md");
  try {
    const { stderr } = await runScan([
      fixture,
      "--output",
      output,
      "--min-severity",
      "low",
    ]);
    const text = await readFile(output, "utf8");
    assert.equal(text.includes("# Aletheia Scan Report"), true);
    assert.equal(stderr.includes(`Wrote report to ${output}`), true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
