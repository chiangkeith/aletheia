import assert from "node:assert/strict";
import test from "node:test";
import { maskComments, maskRegexLiterals, matchesAnyGlob, quoteStateAt } from "../src/utils/text.js";

test("matches ** globs at the repository root and in nested folders", () => {
  assert.equal(matchesAnyGlob("app.js", ["**/*"]), true);
  assert.equal(matchesAnyGlob("src/app.js", ["**/*"]), true);
  assert.equal(matchesAnyGlob("jquery.min.js", ["**/*.min.js"]), true);
  assert.equal(matchesAnyGlob("vendor/jquery.min.js", ["**/*.min.js"]), true);
  assert.equal(matchesAnyGlob("node_modules/pkg/index.js", ["**/node_modules/**"]), true);
  assert.equal(matchesAnyGlob("src/index.js", ["**/node_modules/**"]), false);
  assert.equal(
    matchesAnyGlob("admin/.output/public/_nuxt/BeSCYm_v.js", ["**/.output/**"]),
    true,
  );
  assert.equal(matchesAnyGlob("src/app.js", ["**/.output/**"]), false);
  assert.equal(matchesAnyGlob("public/_nuxt/entry.js", ["**/_nuxt/**"]), true);
});

test("maskComments blanks comments without shifting later indexes", () => {
  const source = 'const kept = 1;\n// const password = "supersecretvalue";\nconst after = 2;\n';
  const masked = maskComments(source);
  assert.equal(masked.length, source.length);
  assert.equal(masked.includes("supersecretvalue"), false);
  assert.equal(masked.includes("const after = 2;"), true);
  assert.equal(masked.split("\n").length, source.split("\n").length);
});

test("quoteStateAt sees a prompt quote as already inside a string", () => {
  const source = 'read -p "Employee Initial Password: " -s USER_PASSWD\n';
  const quoteIndex = source.indexOf('"', source.indexOf("Password"));
  assert.equal(quoteStateAt(source, quoteIndex), '"');
  assert.equal(quoteStateAt('const SECRET = "value";\n', 'const SECRET = '.length), null);
});

test("maskRegexLiterals blanks literals but keeps surrounding code and line offsets", () => {
  const source = "const pattern = /\\beval\\s*\\(/;\neval(userInput);\n";
  const masked = maskRegexLiterals(source);
  assert.equal(masked.includes("/\\beval"), false);
  assert.equal(masked.includes("eval(userInput)"), true);
  assert.equal(masked.length, source.length);
  assert.equal(masked.split("\n").length, source.split("\n").length);
});
