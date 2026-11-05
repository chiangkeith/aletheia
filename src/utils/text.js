const blankSameShape = (text) => text.replace(/[^\n]/g, " ");

export const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, blankSameShape)
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/#(?![\s]*!).*?$/gm, "");

const nextIndex = (source, index, state) => {
  let cursor = index;
  while (cursor < source.length) {
    const char = source[cursor];
    if (char === "\\") {
      cursor += 2;
      continue;
    }
    cursor += 1;
    if (char === state) {
      return cursor;
    }
  }
  return cursor;
};

const lineEnd = (source, index) => {
  const end = source.indexOf("\n", index);
  return end === -1 ? source.length : end;
};

const blockEnd = (source, index) => {
  const end = source.indexOf("*/", index + 2);
  return end === -1 ? source.length : end + 2;
};

export const maskComments = (source) => {
  const pieces = [];
  let cursor = 0;
  while (cursor < source.length) {
    const char = source[cursor];
    const next = source[cursor + 1];
    if (char === "'" || char === '"' || char === "`") {
      const end = nextIndex(source, cursor + 1, char);
      pieces.push(source.slice(cursor, end));
      cursor = end;
      continue;
    }
    if (char === "/" && next === "/") {
      const end = lineEnd(source, cursor);
      pieces.push(" ".repeat(end - cursor));
      cursor = end;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = blockEnd(source, cursor);
      pieces.push(blankSameShape(source.slice(cursor, end)));
      cursor = end;
      continue;
    }
    pieces.push(char);
    cursor += 1;
  }
  return pieces.join("");
};

export const quoteStateAt = (source, index) => {
  let cursor = 0;
  let state = null;
  while (cursor < index) {
    const char = source[cursor];
    const next = source[cursor + 1];
    if (state) {
      if (char === "\\") {
        cursor += 2;
        continue;
      }
      state = char === state ? null : state;
      cursor += 1;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      state = char;
      cursor += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      cursor = lineEnd(source, cursor);
      continue;
    }
    if (char === "/" && next === "*") {
      cursor = blockEnd(source, cursor);
      continue;
    }
    cursor += 1;
  }
  return state;
};

export const maskRegexLiterals = (source) =>
  source.replace(
    /(?<=(?:^|[=(:,[!&|?:;,{}\[])\s*)\/(?:\[(?:\\.|[^\]])*\]|\\.|[^/\n])+\/[gimsuy]*/gm,
    blankSameShape,
  );

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
