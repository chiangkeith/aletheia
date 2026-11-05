import { SEVERITIES, SEVERITY_RANK } from "../core/constants.js";

export const summarizeFindings = (findings) =>
  SEVERITIES.reduce(
    (summary, severity) => ({
      ...summary,
      [severity]: findings.filter((finding) => finding.severity === severity).length,
    }),
    { total: findings.length },
  );

export const sortFindings = (findings) =>
  [...findings].sort((left, right) => {
    const severityDelta = SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return `${left.file}:${left.line}`.localeCompare(`${right.file}:${right.line}`);
  });

export const shouldFail = (findings, failOn) =>
  findings.some((finding) => SEVERITY_RANK[finding.severity] >= SEVERITY_RANK[failOn]);
