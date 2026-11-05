#!/usr/bin/env node

import { runCli } from "../src/cli/index.js";

runCli(process.argv).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
