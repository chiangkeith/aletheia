import { quoteStateAt } from "../utils/text.js";

const SENSITIVE_NAME =
  /password|passwd|pwd|secret|token|credential|api[-_]?key|private[-_]?key/i;

const WEAK_CALL = /\b(?:md5|sha1)\s*\(/i;
const EXPLICIT_WEAK_API = /createHash|createCipher|hashlib|MessageDigest/i;

export const acceptHardcodedSecret = (source, match) => {
  const head = match[0].match(/[:=]\s*(['"])/);
  if (!head || head.index === undefined) {
    return true;
  }
  const quoteIndex = match.index + head.index + head[0].length - 1;
  return quoteStateAt(source, quoteIndex) === null;
};

export const acceptWeakCrypto = (source, match) => {
  if (EXPLICIT_WEAK_API.test(match[0]) || !WEAK_CALL.test(match[0])) {
    return true;
  }
  const region = source.slice(match.index, match.index + match[0].length + 80);
  const prefix = source.slice(Math.max(0, match.index - 48), match.index);
  return SENSITIVE_NAME.test(region) || SENSITIVE_NAME.test(prefix);
};
