import { formatDuration } from "../core/progress.js";

const SEVERITY_LABEL = {
  critical: "CRIT",
  high: "HIGH",
  medium: "MED ",
  low: "LOW ",
  info: "INFO",
};

const pad = (value, length) => String(value).padEnd(length);

const truncate = (value, length) =>
  value.length <= length ? value : `${value.slice(0, length - 1)}…`;

export const renderTable = (result) => {
  const {
    summary,
    findings,
    filesScanned,
    filesSkipped,
    rulesApplied,
    target,
    durationMs,
  } = result;
  const header = [
    `Target        : ${target}`,
    ...(durationMs == null ? [] : [`Duration      : ${formatDuration(durationMs)}`]),
    `Files scanned : ${filesScanned}`,
    ...(filesSkipped
      ? [`Files skipped : ${filesSkipped} (packed or oversized)`]
      : []),
    `Rules applied : ${rulesApplied}`,
    `Findings      : ${summary.total} (critical=${summary.critical}, high=${summary.high}, medium=${summary.medium}, low=${summary.low}, info=${summary.info})`,
    "",
  ].join("\n");

  if (findings.length === 0) {
    return `${header}No findings above the configured severity threshold.`;
  }

  const rows = findings.map((finding) =>
    [
      pad(SEVERITY_LABEL[finding.severity], 5),
      pad(finding.ruleId, 24),
      pad(`${finding.file}:${finding.line}`, 36),
      truncate(finding.message, 72),
    ].join("  "),
  );

  const columns = [
    pad("SEV", 5),
    pad("RULE", 24),
    pad("LOCATION", 36),
    "MESSAGE",
  ].join("  ");

  return `${header}${columns}\n${rows.join("\n")}\n`;
};
