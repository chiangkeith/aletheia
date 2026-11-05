import { relative, resolve } from "node:path";
import { DEFAULT_IGNORE } from "../core/constants.js";
import { matchesAnyGlob, normalizePath } from "../utils/text.js";
import { fileSize, walkFiles } from "../utils/fs.js";
import { detectLanguage, isSupportedLanguage } from "./detectLanguage.js";

const toRelative = (root, filePath) =>
  normalizePath(relative(root, filePath) || filePath);

const ignoredChild = (root, dirPath, ignore) =>
  matchesAnyGlob(`${toRelative(root, dirPath)}/x`, ignore);

const toFileRecord = async (root, absolutePath) => {
  const relativePath = toRelative(root, absolutePath);
  return {
    absolutePath,
    relativePath,
    language: detectLanguage(absolutePath),
    byteSize: await fileSize(absolutePath),
  };
};

export const collectFiles = async ({ root, include, exclude, languages }) => {
  const absoluteRoot = resolve(root);
  const ignore = [...DEFAULT_IGNORE, ...(exclude ?? [])];
  const listed = await walkFiles(absoluteRoot, {
    skipDir: (dirPath) => ignoredChild(absoluteRoot, dirPath, ignore),
  });
  const files = await Promise.all(
    listed.map((absolutePath) => toFileRecord(absoluteRoot, absolutePath)),
  );

  return files
    .filter((file) => isSupportedLanguage(file.language, languages))
    .filter((file) => matchesAnyGlob(file.relativePath, include ?? ["**/*"]))
    .filter((file) => !matchesAnyGlob(file.relativePath, ignore));
};
