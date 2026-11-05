import { relative, resolve } from "node:path";
import { DEFAULT_IGNORE } from "../core/constants.js";
import { matchesAnyGlob, normalizePath } from "../utils/text.js";
import { walkFiles } from "../utils/fs.js";
import { detectLanguage, isSupportedLanguage } from "./detectLanguage.js";

const toRelative = (root, filePath) =>
  normalizePath(relative(root, filePath) || filePath);

export const collectFiles = async ({ root, include, exclude, languages }) => {
  const absoluteRoot = resolve(root);
  const ignore = [...DEFAULT_IGNORE, ...(exclude ?? [])];
  const files = await walkFiles(absoluteRoot);

  return files
    .map((absolutePath) => {
      const relativePath = toRelative(absoluteRoot, absolutePath);
      const language = detectLanguage(absolutePath);
      return { absolutePath, relativePath, language };
    })
    .filter((file) => isSupportedLanguage(file.language, languages))
    .filter((file) => matchesAnyGlob(file.relativePath, include ?? ["**/*"]))
    .filter((file) => !matchesAnyGlob(file.relativePath, ignore));
};
