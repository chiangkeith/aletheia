import { collectFiles } from "../ingest/collectFiles.js";
import { readText } from "../utils/fs.js";
import { getRules } from "../rules/catalog.js";
import { applyRules } from "../engine/applyRules.js";
import { meetsSeverity } from "./config.js";
import { sortFindings, summarizeFindings } from "../engine/score.js";

const loadSources = (files) =>
  Promise.all(
    files.map(async (file) => ({
      ...file,
      source: await readText(file.absolutePath),
    })),
  );

export const scanProject = async ({ target, config }) => {
  const files = await collectFiles({
    root: target,
    include: config.include,
    exclude: config.exclude,
    languages: config.languages,
  });
  const sourced = await loadSources(files);
  const rules = getRules({
    languages: config.languages,
    enable: config.rules.enable,
    disable: config.rules.disable,
  });
  const findings = sortFindings(
    applyRules(sourced, rules).filter((finding) =>
      meetsSeverity(config.minSeverity, finding.severity),
    ),
  );

  return {
    target,
    scannedAt: new Date().toISOString(),
    filesScanned: sourced.length,
    rulesApplied: rules.length,
    summary: summarizeFindings(findings),
    findings,
  };
};
