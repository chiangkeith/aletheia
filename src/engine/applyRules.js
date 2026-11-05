import { LANGUAGES } from "../core/constants.js";
import { lineNumberAt, maskComments, maskRegexLiterals, snippetAround } from "../utils/text.js";

const maskJavascript = (source) => maskComments(maskRegexLiterals(source));

const SOURCE_PREPROCESSORS = Object.freeze({
  [LANGUAGES.javascript]: maskJavascript,
  [LANGUAGES.typescript]: maskJavascript,
});

const identity = (source) => source;

const sourceForMatching = (file) =>
  (SOURCE_PREPROCESSORS[file.language] ?? identity)(file.source);

const matchAll = (source, pattern) => [...source.matchAll(new RegExp(pattern, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`))];

const toFinding = ({ file, rule, match }) => ({
  ruleId: rule.id,
  title: rule.title,
  severity: rule.severity,
  cwe: rule.cwe,
  owasp: rule.owasp,
  message: rule.message,
  remediation: rule.remediation,
  file: file.relativePath,
  language: file.language,
  line: lineNumberAt(file.source, match.index ?? 0),
  snippet: snippetAround(file.source, match.index ?? 0),
});

const applyRuleToFile = (file, rule) => {
  const searchable = sourceForMatching(file);
  const accept = rule.accept ?? (() => true);
  return rule.patterns.flatMap((pattern) =>
    matchAll(searchable, pattern)
      .filter((match) => accept(searchable, match))
      .map((match) => toFinding({ file, rule, match })),
  );
};

const uniqueKey = (finding) => `${finding.file}:${finding.line}:${finding.ruleId}`;

export const findingsForFile = (file, rules) =>
  rules
    .filter((rule) => rule.languages.includes(file.language))
    .flatMap((rule) => applyRuleToFile(file, rule));

export const dedupeFindings = (findings) =>
  findings.filter(
    (finding, index, all) =>
      all.findIndex((item) => uniqueKey(item) === uniqueKey(finding)) === index,
  );

export const applyRules = (files, rules) =>
  dedupeFindings(files.flatMap((file) => findingsForFile(file, rules)));
