#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config();
import { KontistClient } from "../kontist-client";
const kontist = new KontistClient();
import { Command } from "commander";

const program = new Command();

program
    .command("list")
    .description("list all accounts for the current user")
    .action(async () => {
        try {
            await kontist.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD);
            const accounts = await kontist.getAccounts();
            process.stdout.write(JSON.stringify(accounts, null, 4));
        } catch (error) {
            console.error(error);
        }
    });

program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
