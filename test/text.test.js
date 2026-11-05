import assert from "node:assert/strict";
import test from "node:test";
import { maskRegexLiterals, matchesAnyGlob } from "../src/utils/text.js";

test("matches ** globs at the repository root and in nested folders", () => {
  assert.equal(matchesAnyGlob("app.js", ["**/*"]), true);
  assert.equal(matchesAnyGlob("src/app.js", ["**/*"]), true);
  assert.equal(matchesAnyGlob("jquery.min.js", ["**/*.min.js"]), true);
  assert.equal(matchesAnyGlob("vendor/jquery.min.js", ["**/*.min.js"]), true);
  assert.equal(matchesAnyGlob("node_modules/pkg/index.js", ["**/node_modules/**"]), true);
  assert.equal(matchesAnyGlob("src/index.js", ["**/node_modules/**"]), false);
});

test("maskRegexLiterals blanks literals but keeps surrounding code and line offsets", () => {
  const source = "const pattern = /\\beval\\s*\\(/;\neval(userInput);\n";
  const masked = maskRegexLiterals(source);
  assert.equal(masked.includes("/\\beval"), false);
  assert.equal(masked.includes("eval(userInput)"), true);
  assert.equal(masked.length, source.length);
  assert.equal(masked.split("\n").length, source.split("\n").length);
});
