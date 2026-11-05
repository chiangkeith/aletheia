import {
  PROGRESS,
  describeRuleSelection,
  formatDuration,
  formatFindingCounts,
  formatLanguageCounts,
  formatSkipCounts,
} from "../core/progress.js";

const padCount = (current, total) =>
  String(current).padStart(String(total).length, " ");

const doneMessage = (event) =>
  event.summary.total === 0
    ? `Done in ${formatDuration(event.durationMs)} — no findings above threshold`
    : `Done in ${formatDuration(event.durationMs)} — ${event.summary.total} findings (${formatFindingCounts(event.summary)})`;

const LINES = Object.freeze({
  [PROGRESS.start]: (event) =>
    [
      "Aletheia",
      `  target       ${event.target}`,
      `  config       ${event.configPath ?? "(defaults)"}`,
      `  languages    ${event.languages.join(", ")}`,
      `  rules        ${describeRuleSelection(event.rules)}`,
      `  min-severity ${event.minSeverity}`,
      `  fail-on      ${event.failOn}`,
    ].join("\n"),
  [PROGRESS.collectStart]: () => "Collecting source files...",
  [PROGRESS.collectDone]: (event) =>
    event.total === 0
      ? "  0 files matched the include/exclude filters"
      : `  ${event.total} files (${formatLanguageCounts(event.languageCounts)})`,
  [PROGRESS.readStart]: (event) =>
    event.total === 0 ? null : `Reading ${event.total} files...`,
  [PROGRESS.readDone]: () => null,
  [PROGRESS.skip]: (event) =>
    event.total === 0
      ? null
      : `  skipped ${event.total} packed or oversized files (${formatSkipCounts(event)})`,
  [PROGRESS.matchStart]: (event) =>
    event.files === 0
      ? null
      : `Applying ${event.rules} rules to ${event.files} files...`,
  [PROGRESS.matchItem]: (event) =>
    `  ${padCount(event.current, event.total)}/${event.total}  ${event.file}`,
  [PROGRESS.matchDone]: () => null,
  [PROGRESS.done]: (event) => `${doneMessage(event)}\n`,
});

export const formatProgress = (event) => LINES[event.type]?.(event) ?? null;

export const createProgressReporter = ({
  stream = process.stderr,
  isTTY = Boolean(stream.isTTY),
  verbose = false,
  quiet = false,
} = {}) => {
  if (quiet) {
    return { onProgress: () => {}, finish: () => {} };
  }

  const io = { overwriteOpen: false };

  const clearOverwrite = () => {
    if (!io.overwriteOpen) {
      return;
    }
    stream.write("\r\x1b[2K");
    io.overwriteOpen = false;
  };

  const writeLine = (text) => {
    clearOverwrite();
    stream.write(`${text}\n`);
  };

  const writeOverwrite = (text) => {
    stream.write(`\r\x1b[2K${text}`);
    io.overwriteOpen = true;
  };

  const onProgress = (event) => {
    const text = formatProgress(event);
    if (!text) {
      return;
    }

    if (event.type !== PROGRESS.matchItem) {
      writeLine(text);
      if (event.type === PROGRESS.skip && verbose) {
        (event.files ?? []).forEach((skipped) => {
          writeLine(`  skip  ${skipped.file} (${skipped.reason})`);
        });
      }
      return;
    }

    if (verbose) {
      writeLine(text);
      return;
    }

    if (isTTY) {
      writeOverwrite(text);
    }
  };

  const finish = () => {
    if (!io.overwriteOpen) {
      return;
    }
    stream.write("\n");
    io.overwriteOpen = false;
  };

  return { onProgress, finish };
};
