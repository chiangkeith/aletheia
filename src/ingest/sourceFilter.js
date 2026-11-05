import { LANGUAGES, MAX_SOURCE_BYTES } from "../core/constants.js";

const PACKED_LANGUAGES = new Set([LANGUAGES.javascript, LANGUAGES.typescript]);
const MIN_PACKED_CHARS = 4000;
const MAX_AVERAGE_LINE = 240;
const MAX_LINE_LENGTH = 500;

export const isOversized = (byteSize) => byteSize > MAX_SOURCE_BYTES;

const longestLineLength = (source) =>
  source.split(/\r?\n/).reduce((max, line) => Math.max(max, line.length), 0);

const averageLineLength = (source) => {
  const lineCount = (source.match(/\r?\n/g) ?? []).length + 1;
  return source.length / lineCount;
};

export const isPackedSource = (source, language) =>
  PACKED_LANGUAGES.has(language) &&
  source.length >= MIN_PACKED_CHARS &&
  (longestLineLength(source) >= MAX_LINE_LENGTH ||
    averageLineLength(source) >= MAX_AVERAGE_LINE);

export const partition = (items, predicate) =>
  items.reduce(
    (groups, item) =>
      predicate(item)
        ? { yes: [...groups.yes, item], no: groups.no }
        : { yes: groups.yes, no: [...groups.no, item] },
    { yes: [], no: [] },
  );
