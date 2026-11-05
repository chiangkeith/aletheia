const LEVEL = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "note",
  info: "note",
};

const toRule = (ruleId, findings) => {
  const sample = findings.find((finding) => finding.ruleId === ruleId);
  return {
    id: ruleId,
    shortDescription: { text: sample.title },
    help: { text: sample.remediation },
    properties: { cwe: sample.cwe, owasp: sample.owasp },
    defaultConfiguration: { level: LEVEL[sample.severity] },
  };
};

const toResult = (finding) => ({
  ruleId: finding.ruleId,
  level: LEVEL[finding.severity],
  message: { text: finding.message },
  locations: [
    {
      physicalLocation: {
        artifactLocation: { uri: finding.file },
        region: { startLine: finding.line, snippet: { text: finding.snippet } },
      },
    },
  ],
});

export const renderSarif = (result) => {
  const ruleIds = [...new Set(result.findings.map((finding) => finding.ruleId))];
  const sarif = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "aletheia",
            version: "1.0.0",
            informationUri: "https://github.com/example/aletheia",
            rules: ruleIds.map((ruleId) => toRule(ruleId, result.findings)),
          },
        },
        results: result.findings.map(toResult),
      },
    ],
  };
  return `${JSON.stringify(sarif, null, 2)}\n`;
};
