import { lineNumberAt, snippetAround } from "../utils/text.js";

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

const applyRuleToFile = (file, rule) =>
  rule.patterns.flatMap((pattern) =>
    matchAll(file.source, pattern).map((match) => toFinding({ file, rule, match })),
  );

const uniqueKey = (finding) => `${finding.file}:${finding.line}:${finding.ruleId}`;

export const applyRules = (files, rules) =>
  files
    .flatMap((file) =>
      rules
        .filter((rule) => rule.languages.includes(file.language))
        .flatMap((rule) => applyRuleToFile(file, rule)),
    )
    .filter(
      (finding, index, all) =>
        all.findIndex((item) => uniqueKey(item) === uniqueKey(finding)) === index,
    );
