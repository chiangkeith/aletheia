import { Command } from "commander";
import { scanCommand } from "./commands/scan.js";
import { rulesCommand } from "./commands/rules.js";
import { initCommand } from "./commands/init.js";

const buildProgram = () => {
  const program = new Command();

  program
    .name("aletheia")
    .description("Unconceal security flaws in web service source code")
    .version("1.0.0");

  program
    .command("scan")
    .argument("[target]", "path to a web service project", ".")
    .option("-c, --config <path>", "path to aletheia.config.json")
    .option("-f, --format <format>", "table | json | markdown | sarif", "table")
    .option("-o, --output <path>", "write the report to a file")
    .option("--min-severity <level>", "info | low | medium | high | critical", "info")
    .option("--fail-on <level>", "exit 2 if a finding at this severity or above exists", "high")
    .option("--languages <list>", "comma-separated languages")
    .option("--include <globs>", "comma-separated include globs")
    .option("--exclude <globs>", "comma-separated extra exclude globs")
    .option("--only <ids>", "comma-separated rule ids to enable")
    .option("--disable <ids>", "comma-separated rule ids to disable")
    .action((target, options) => scanCommand(target, options));

  program
    .command("rules")
    .description("list built-in detection rules")
    .option("--id <ruleId>", "show one rule")
    .option("--json", "print JSON")
    .action((options) => rulesCommand(options));

  program
    .command("init")
    .description("write aletheia.config.json in the current directory")
    .option("--force", "overwrite an existing config file")
    .action((options) => initCommand(options));

  return program;
};

export const runCli = (argv) => buildProgram().parseAsync(argv);
