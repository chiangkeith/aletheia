import { RULES, getRuleById } from "../../rules/catalog.js";

const formatRule = (rule) =>
  [
    `${rule.id}`,
    `  ${rule.title}`,
    `  severity : ${rule.severity}`,
    `  cwe      : ${rule.cwe}`,
    `  owasp    : ${rule.owasp}`,
    `  languages: ${rule.languages.join(", ")}`,
    `  ${rule.message}`,
    `  fix      : ${rule.remediation}`,
    "",
  ].join("\n");

export const rulesCommand = ({ id, json }) => {
  const selected = id ? [getRuleById(id)].filter(Boolean) : RULES;
  if (id && selected.length === 0) {
    throw new Error(`Unknown rule: ${id}`);
  }
  const output = json
    ? `${JSON.stringify(selected, null, 2)}\n`
    : selected.map(formatRule).join("\n");
  process.stdout.write(output);
};
