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

test("flags lowercase SQL concatenation", () => {
  const ids = scanSnippet(
    "javascript",
    'db.query("select * from users where id = " + req.query.id);\n',
  );
  assert.equal(ids.includes("sql-injection"), true);
});

test("does not treat an HTTP client delete as SQL", () => {
  const ids = scanSnippet(
    "javascript",
    "supertest(app).delete('/ticket/' + ticketUuid);\n",
  );
  assert.equal(ids.includes("sql-injection"), false);
});

test("flags a template SQL query", () => {
  const ids = scanSnippet(
    "javascript",
    "db.query(`SELECT * FROM users WHERE id = ${id}`);\n",
  );
  assert.equal(ids.includes("sql-injection"), true);
});

test("does not treat a password prompt as a hardcoded secret", () => {
  const ids = scanSnippet(
    "generic",
    [
      'read -p "Employee: ${EMPLOYEE_NUMBER} Initial Password: " -s USER_PASSWD',
      'if [ `echo "$USER_PASSWD" | wc` ]',
      "",
    ].join("\n"),
  );
  assert.equal(ids.includes("hardcoded-secret"), false);
});

test("flags a hardcoded secret assignment", () => {
  const ids = scanSnippet(
    "javascript",
    "const config = { SECRET : 'wannalookorbook' };\n",
  );
  assert.equal(ids.includes("hardcoded-secret"), true);
});

test("does not flag md5 of an identifier", () => {
  const ids = scanSnippet(
    "javascript",
    "const review_reviewer_id = md5(reviewerId);\n",
  );
  assert.equal(ids.includes("weak-crypto"), false);
});

test("flags an explicit MD5 hash selection", () => {
  const ids = scanSnippet(
    "javascript",
    "crypto.createHash('md5').update(payload).digest('hex');\n",
  );
  assert.equal(ids.includes("weak-crypto"), true);
});

test("does not flag a commented-out secret", () => {
  const ids = scanSnippet(
    "javascript",
    '// const password = "supersecretvalue";\nconst ok = true;\n',
  );
  assert.equal(ids.includes("hardcoded-secret"), false);
});

test("does not flag a plain-text response template as XSS", () => {
  const ids = scanSnippet(
    "javascript",
    "res.send(`${log.check_log_msg || ''}\\n${log.check_log_err || ''}`);\n",
  );
  assert.equal(ids.includes("xss-sink"), false);
});

test("flags HTML built from request data", () => {
  const ids = scanSnippet(
    "javascript",
    "res.send(`<h1>${req.query.name}</h1>`);\n",
  );
  assert.equal(ids.includes("xss-sink"), true);
});
