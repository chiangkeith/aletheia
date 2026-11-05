import assert from "node:assert/strict";
import test from "node:test";
import { applyRules } from "../src/engine/applyRules.js";
import { getRules } from "../src/rules/catalog.js";

const scanSnippet = (language, source) =>
  applyRules(
    [{ relativePath: "snippet.js", language, source }],
    getRules({ languages: [language] }),
  ).map((finding) => finding.ruleId);

test("flags concatenated SQL", () => {
  const ids = scanSnippet(
    "javascript",
    'const sql = "SELECT * FROM users WHERE id = \'" + req.query.id;',
  );
  assert.equal(ids.includes("sql-injection"), true);
});

test("flags command execution with string concatenation", () => {
  const ids = scanSnippet("javascript", 'exec("ping " + req.query.host);');
  assert.equal(ids.includes("command-injection"), true);
});

test("does not flag parameterized SQL", () => {
  const ids = scanSnippet(
    "javascript",
    'db.query("SELECT id FROM users WHERE name = ?", [name]);',
  );
  assert.equal(ids.includes("sql-injection"), false);
});

test("does not flag sinks that only appear inside regex literals", () => {
  const ids = scanSnippet(
    "javascript",
    "const patterns = [/\\beval\\s*\\(/, /SELECT .* \\+/, /__proto__/];\n",
  );
  assert.equal(ids.includes("code-injection"), false);
  assert.equal(ids.includes("sql-injection"), false);
  assert.equal(ids.includes("prototype-pollution"), false);
});

test("still flags a real eval call", () => {
  const ids = scanSnippet("javascript", "eval(req.query.code);\n");
  assert.equal(ids.includes("code-injection"), true);
});

test("does not flag documentation that names MD5", () => {
  const ids = scanSnippet(
    "javascript",
    'const message = "MD5, SHA-1, or DES are not suitable";\n',
  );
  assert.equal(ids.includes("weak-crypto"), false);
});

test("flags md5 used as a function", () => {
  const ids = scanSnippet("javascript", "const digest = md5(password);\n");
  assert.equal(ids.includes("weak-crypto"), true);
});
