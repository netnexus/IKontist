#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
    .version("0.2.2")
    .command("transaction <action>", "list transactions, format can be json or qif")
    .command("account <action>", "list accounts")
    .command("user <action>", "return information about current user")
    .command("statement <action>", "export pdf for e.g. 2017 02")
    .command("transfer <action>", "list, init or confirm transfers");

program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}

module.exports = {};
