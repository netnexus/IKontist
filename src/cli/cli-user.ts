#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config();
import { KontistClient } from "../kontist-client";
const kontist = new KontistClient();
import { Command } from "commander";

const program = new Command();

program
  .command("info")
  .description("return all user information")
  .action(async () => {
    try {
      await kontist.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD);
      const user = await kontist.getUser();
      process.stdout.write(JSON.stringify(user, null, 4));
    } catch (error) {
      console.error(error);
    }
  });

program.parse(process.argv);
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
