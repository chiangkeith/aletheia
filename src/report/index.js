import { writeFile } from "node:fs/promises";
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

export const supportedFormats = () => Object.keys(RENDERERS);

export const renderReport = (result, format) => {
  const renderer = RENDERERS[format];
  if (!renderer) {
    throw new Error(`Unsupported format: ${format}. Use ${supportedFormats().join(", ")}.`);
  }
  return renderer(result);
};

export const writeReport = async (content, outputPath) => {
  if (!outputPath) {
    process.stdout.write(`${content.endsWith("\n") ? content : `${content}\n`}`);
    return;
  }
  await writeFile(outputPath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
};
