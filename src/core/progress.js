const SEVERITY_ORDER = Object.freeze([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const PROGRESS = Object.freeze({
  start: "scan:start",
  collectStart: "collect:start",
  collectDone: "collect:done",
  readStart: "read:start",
  readDone: "read:done",
  skip: "scan:skip",
  matchStart: "match:start",
  matchItem: "match:item",
  matchDone: "match:done",
  done: "scan:done",
});

export const countByLanguage = (files) =>
  files.reduce(
    (counts, file) => ({
      ...counts,
      [file.language]: (counts[file.language] ?? 0) + 1,
    }),
    {},
  );

export const formatLanguageCounts = (counts) =>
  Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([language, count]) => `${language}=${count}`)
    .join(", ");

export const formatFindingCounts = (summary) =>
  SEVERITY_ORDER.filter((severity) => summary[severity] > 0)
    .map((severity) => `${severity}=${summary[severity]}`)
    .join(", ");

export const formatDuration = (ms) =>
  ms < 1000 ? `${Math.max(0, Math.round(ms))}ms` : `${(ms / 1000).toFixed(2)}s`;

export const formatSkipCounts = ({ packed = 0, oversized = 0 }) =>
  [
    packed > 0 ? `packed=${packed}` : null,
    oversized > 0 ? `oversized=${oversized}` : null,
  ]
    .filter(Boolean)
    .join(", ");

export const describeRuleSelection = (rulesConfig) => {
  if (rulesConfig.enable.length > 0) {
    return rulesConfig.enable.join(", ");
  }
  if (rulesConfig.disable.length > 0) {
    return `all except ${rulesConfig.disable.join(", ")}`;
  }
  return "all built-in";
};
