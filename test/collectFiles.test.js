import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectFiles } from "../src/ingest/collectFiles.js";

const fixture = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "sample-web-service",
);

test("collectFiles includes source files and skips ignored directories", async () => {
  const files = await collectFiles({
    root: fixture,
    include: ["**/*"],
    exclude: ["**/node_modules/**"],
    languages: ["javascript", "python", "generic"],
  });
  const relativePaths = files.map((file) => file.relativePath).sort();

  assert.equal(relativePaths.includes("src/app.js"), true);
  assert.equal(relativePaths.includes("src/service.py"), true);
  assert.equal(relativePaths.includes("package.json"), true);
  assert.equal(
    relativePaths.some((path) => path.includes("node_modules")),
    false,
  );
  assert.equal(
    relativePaths.some((path) => path.includes(".output") || path.includes("_nuxt")),
    false,
  );
});
