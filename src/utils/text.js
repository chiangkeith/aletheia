export const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/#(?![\s]*!).*?$/gm, "");

export const splitLines = (source) => source.split(/\r?\n/);

export const lineNumberAt = (source, index) =>
  source.slice(0, index).split(/\r?\n/).length;

export const snippetAround = (source, index, radius = 80) => {
  const start = Math.max(0, index - radius);
  const end = Math.min(source.length, index + radius);
  return source.slice(start, end).replace(/\s+/g, " ").trim();
};

export const toGlobRegex = (glob) => {
  const source = glob
    .replaceAll("\\", "/")
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000\//g, "(?:.*/)?")
    .replace(/\u0000/g, ".*");
  return new RegExp(`^${source}$`);
};

export const matchesAnyGlob = (filePath, globs) =>
  globs.some((glob) => toGlobRegex(glob.replaceAll("\\", "/")).test(filePath.replaceAll("\\", "/")));

export const normalizePath = (filePath) => filePath.replaceAll("\\", "/");
