const severityOrder = ["critical", "high", "medium", "low", "info"];

const findingSection = (finding) =>
  [
    `### ${finding.title}`,
    "",
    `- **Rule:** \`${finding.ruleId}\``,
    `- **Severity:** ${finding.severity}`,
    `- **CWE:** ${finding.cwe}`,
    `- **OWASP:** ${finding.owasp}`,
    `- **Location:** \`${finding.file}:${finding.line}\``,
    `- **Language:** ${finding.language}`,
    "",
    finding.message,
    "",
    "```",
    finding.snippet,
    "```",
    "",
    `**Remediation:** ${finding.remediation}`,
    "",
  ].join("\n");

export const renderMarkdown = (result) => {
  const counts = severityOrder
    .map((severity) => `- ${severity}: ${result.summary[severity]}`)
    .join("\n");

  const body =
    result.findings.length === 0
      ? "No findings above the configured severity threshold.\n"
      : result.findings.map(findingSection).join("\n");

  return [
    `# Aletheia Scan Report`,
    "",
    `- Target: \`${result.target}\``,
    `- Scanned at: ${result.scannedAt}`,
    `- Files scanned: ${result.filesScanned}`,
    `- Rules applied: ${result.rulesApplied}`,
    `- Total findings: ${result.summary.total}`,
    "",
    "## Summary",
    "",
    counts,
    "",
    "## Findings",
    "",
    body,
  ].join("\n");
};
