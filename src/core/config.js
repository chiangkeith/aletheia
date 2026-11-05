import { dirname, isAbsolute, join, resolve } from "node:path";
import { DEFAULT_CONFIG_NAMES, DEFAULT_IGNORE, SEVERITY_RANK } from "./constants.js";
import { fileExists, readText } from "../utils/fs.js";

const DEFAULTS = Object.freeze({
  include: ["**/*"],
  exclude: DEFAULT_IGNORE,
  languages: ["javascript", "typescript", "python", "php", "java", "go", "generic"],
  minSeverity: "info",
  failOn: "high",
  format: "table",
  rules: { enable: [], disable: [] },
});

const parseJson = (raw, source) => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${source}: ${error.message}`);
  }
};

const findConfigFile = async (cwd) => {
  const candidates = DEFAULT_CONFIG_NAMES.map((name) => join(cwd, name));
  const matches = await Promise.all(
    candidates.map(async (path) => ((await fileExists(path)) ? path : null)),
  );
  return matches.find(Boolean) ?? null;
};

const mergeConfig = (base, override) => ({
  ...base,
  ...override,
  include: override.include ?? base.include,
  exclude: [...new Set([...(base.exclude ?? []), ...(override.exclude ?? [])])],
  languages: override.languages ?? base.languages,
  rules: {
    enable: override.rules?.enable ?? base.rules.enable,
    disable: override.rules?.disable ?? base.rules.disable,
  },
});

export const loadConfig = async ({ cwd, configPath, cliOverrides = {} }) => {
  const resolvedConfigPath = configPath
    ? isAbsolute(configPath)
      ? configPath
      : resolve(cwd, configPath)
    : await findConfigFile(cwd);

  const fileConfig = resolvedConfigPath
    ? parseJson(await readText(resolvedConfigPath), resolvedConfigPath)
    : {};

  return {
    ...mergeConfig(mergeConfig(DEFAULTS, fileConfig), cliOverrides),
    cwd,
    configPath: resolvedConfigPath,
    configDir: resolvedConfigPath ? dirname(resolvedConfigPath) : cwd,
  };
};

export const isEnabledRule = (config, ruleId) => {
  const { enable, disable } = config.rules;
  if (enable.length > 0 && !enable.includes(ruleId)) {
    return false;
  }
  return !disable.includes(ruleId);
};

export const meetsSeverity = (minSeverity, severity) =>
  SEVERITY_RANK[severity] >= SEVERITY_RANK[minSeverity];
