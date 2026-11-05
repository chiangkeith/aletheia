import { collectFiles } from "../ingest/collectFiles.js";
import { isOversized, isPackedSource, partition } from "../ingest/sourceFilter.js";
import { readText } from "../utils/fs.js";
import { getRules } from "../rules/catalog.js";
import { dedupeFindings, findingsForFile } from "../engine/applyRules.js";
import { meetsSeverity } from "./config.js";
import { sortFindings, summarizeFindings } from "../engine/score.js";
import { PROGRESS, countByLanguage } from "./progress.js";

const noop = () => {};

const loadSources = (files) =>
  Promise.all(
    files.map(async (file) => ({
      ...file,
      source: await readText(file.absolutePath),
    })),
  );

const emit = (onProgress, type, payload = {}) => onProgress({ type, ...payload });

const withSkip = (reason) => (file) => ({
  file: file.relativePath,
  reason,
  byteSize: file.byteSize,
});

const matchFiles = (files, rules, onProgress) =>
  files.flatMap((file, index) => {
    emit(onProgress, PROGRESS.matchItem, {
      current: index + 1,
      total: files.length,
      file: file.relativePath,
    });
    return findingsForFile(file, rules);
  });

export const scanProject = async ({ target, config, onProgress = noop }) => {
  const startedAt = Date.now();

  emit(onProgress, PROGRESS.start, {
    target,
    configPath: config.configPath,
    languages: config.languages,
    minSeverity: config.minSeverity,
    failOn: config.failOn,
    rules: config.rules,
  });

  emit(onProgress, PROGRESS.collectStart);
  const collected = await collectFiles({
    root: target,
    include: config.include,
    exclude: config.exclude,
    languages: config.languages,
  });
  const { yes: oversized, no: readable } = partition(collected, (file) =>
    isOversized(file.byteSize),
  );
  emit(onProgress, PROGRESS.collectDone, {
    total: readable.length,
    languageCounts: countByLanguage(readable),
  });

  emit(onProgress, PROGRESS.readStart, { total: readable.length });
  const sourced = await loadSources(readable);
  const { yes: packed, no: analyzable } = partition(sourced, (file) =>
    isPackedSource(file.source, file.language),
  );
  emit(onProgress, PROGRESS.readDone, { total: analyzable.length });

  const skipped = [
    ...oversized.map(withSkip("oversized")),
    ...packed.map(withSkip("packed")),
  ];
  emit(onProgress, PROGRESS.skip, {
    total: skipped.length,
    oversized: oversized.length,
    packed: packed.length,
    files: skipped,
  });

  const rules = getRules({
    languages: config.languages,
    enable: config.rules.enable,
    disable: config.rules.disable,
  });

  emit(onProgress, PROGRESS.matchStart, {
    files: analyzable.length,
    rules: rules.length,
  });
  const findings = sortFindings(
    dedupeFindings(matchFiles(analyzable, rules, onProgress)).filter((finding) =>
      meetsSeverity(config.minSeverity, finding.severity),
    ),
  );
  emit(onProgress, PROGRESS.matchDone, { total: findings.length });

  const summary = summarizeFindings(findings);
  const durationMs = Date.now() - startedAt;
  const result = {
    target,
    scannedAt: new Date().toISOString(),
    durationMs,
    filesScanned: analyzable.length,
    filesSkipped: skipped.length,
    rulesApplied: rules.length,
    summary,
    findings,
  };

  emit(onProgress, PROGRESS.done, {
    durationMs,
    filesScanned: result.filesScanned,
    filesSkipped: result.filesSkipped,
    rulesApplied: result.rulesApplied,
    summary,
  });

  return result;
};
