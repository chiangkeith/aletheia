import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../../utils/fs.js";

const SAMPLE_CONFIG = {
  include: ["**/*"],
  exclude: ["**/node_modules/**", "**/dist/**", "**/test/**", "**/fixtures/**"],
  languages: ["javascript", "typescript", "python", "php", "java", "go", "generic"],
  minSeverity: "low",
  failOn: "high",
  format: "table",
  rules: {
    enable: [],
    disable: [],
  },
};

export const initCommand = async ({ force = false } = {}) => {
  const path = join(process.cwd(), "webvuln.config.json");
  if ((await fileExists(path)) && !force) {
    throw new Error(`${path} already exists. Re-run with --force to overwrite.`);
  }
  await writeFile(path, `${JSON.stringify(SAMPLE_CONFIG, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote ${path}\n`);
};
