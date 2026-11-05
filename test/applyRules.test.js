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
