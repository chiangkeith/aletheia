import assert from "node:assert/strict";
import test from "node:test";
import { detectLanguage } from "../src/ingest/detectLanguage.js";

const cases = [
  ["src/app.js", "javascript"],
  ["src/app.ts", "typescript"],
  ["src/service.py", "python"],
  ["index.php", "php"],
  ["Main.java", "java"],
  ["server.go", "go"],
  [".env", "generic"],
];

test("detectLanguage maps extensions", () => {
  cases.forEach(([file, language]) => {
    assert.equal(detectLanguage(file), language);
  });
});
