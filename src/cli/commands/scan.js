import { resolve } from "node:path";
import { loadConfig } from "../../core/config.js";
import { EXIT_CODES } from "../../core/constants.js";
import { scanProject } from "../../core/pipeline.js";
import { shouldFail } from "../../engine/score.js";
import { renderReport, resolveReportFormat, writeReport } from "../../report/index.js";
import { createProgressReporter } from "../progress.js";

const csv = (value) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;

const definedEntries = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));

export const scanCommand = async (targetArg, options) => {
  const cwd = process.cwd();
  const target = resolve(cwd, targetArg);
  const enable = csv(options.only);
  const disable = csv(options.disable);
  const config = await loadConfig({
    cwd,
    configPath: options.config,
    cliOverrides: definedEntries({
      format: options.format,
      minSeverity: options.minSeverity,
      failOn: options.failOn,
      languages: csv(options.languages),
      exclude: csv(options.exclude),
      include: csv(options.include),
      rules:
        enable || disable
          ? { enable: enable ?? [], disable: disable ?? [] }
          : undefined,
    }),
  });

  const quiet = Boolean(options.quiet) || options.progress === false;
  const reporter = createProgressReporter({
    stream: process.stderr,
    isTTY: Boolean(process.stderr.isTTY),
    verbose: Boolean(options.verbose),
    quiet,
  });

  try {
    const result = await scanProject({
      target,
      config,
      onProgress: reporter.onProgress,
    });
    reporter.finish();

    const format = resolveReportFormat({
      cliFormat: options.format,
      outputPath: options.output,
      configFormat: config.format,
    });
    const report = renderReport(result, format);
    await writeReport(report, options.output);

    if (options.output && !quiet) {
      process.stderr.write(`Wrote report to ${options.output}\n`);
    }

    process.exitCode = shouldFail(result.findings, options.failOn ?? config.failOn)
      ? EXIT_CODES.findings
      : EXIT_CODES.ok;
    return result;
  } finally {
    reporter.finish();
  }
};
