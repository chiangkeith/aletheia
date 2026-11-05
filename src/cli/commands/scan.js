import { resolve } from "node:path";
import { loadConfig } from "../../core/config.js";
import { EXIT_CODES } from "../../core/constants.js";
import { scanProject } from "../../core/pipeline.js";
import { shouldFail } from "../../engine/score.js";
import { renderReport, writeReport } from "../../report/index.js";

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

  const result = await scanProject({ target, config });
  const report = renderReport(result, options.format ?? config.format);
  await writeReport(report, options.output);

  if (shouldFail(result.findings, options.failOn ?? config.failOn)) {
    process.exitCode = EXIT_CODES.findings;
    return result;
  }

  process.exitCode = EXIT_CODES.ok;
  return result;
};
