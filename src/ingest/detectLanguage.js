import { extname } from "node:path";
import { EXTENSION_LANGUAGE, LANGUAGES } from "../core/constants.js";

export const detectLanguage = (filePath) =>
  EXTENSION_LANGUAGE[extname(filePath).toLowerCase()] ?? LANGUAGES.generic;

export const isSupportedLanguage = (language, allowed) => allowed.includes(language);
