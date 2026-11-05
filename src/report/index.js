import { dirname, extname } from "node:path";
import { writeFile } from "node:fs/promises";
import { ensureDir } from "../utils/fs.js";
import { renderJson } from "./json.js";
import { renderMarkdown } from "./markdown.js";
import { renderSarif } from "./sarif.js";
import { renderTable } from "./table.js";

const RENDERERS = Object.freeze({
  table: renderTable,
  json: renderJson,
  markdown: renderMarkdown,
  sarif: renderSarif,
});

const FORMAT_BY_EXTENSION = Object.freeze({
  ".md": "markdown",
  ".markdown": "markdown",
  ".json": "json",
  ".sarif": "sarif",
  ".txt": "table",
});

const withTrailingNewline = (content) =>
  content.endsWith("\n") ? content : `${content}\n`;

export const supportedFormats = () => Object.keys(RENDERERS);

export const formatFromOutputPath = (outputPath) => {
  if (!outputPath) {
    return undefined;
  }
  return FORMAT_BY_EXTENSION[extname(outputPath).toLowerCase()];
};

export const resolveReportFormat = ({ cliFormat, outputPath, configFormat }) =>
  cliFormat ?? formatFromOutputPath(outputPath) ?? configFormat ?? "table";

export const renderReport = (result, format) => {
  const renderer = RENDERERS[format];
  if (!renderer) {
    throw new Error(`Unsupported format: ${format}. Use ${supportedFormats().join(", ")}.`);
  }
  return renderer(result);
};

export const writeReport = async (content, outputPath) => {
  const body = withTrailingNewline(content);
  if (!outputPath) {
    process.stdout.write(body);
    return;
  }
  await ensureDir(dirname(outputPath));
  await writeFile(outputPath, body, "utf8");
};
