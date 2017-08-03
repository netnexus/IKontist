#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config();
import { KontistClient } from "../kontist-client";
const kontist = new KontistClient();
import { Command } from "commander";

const program = new Command();

program
    .command("export <year> <month> [accountId]", "download a PDF, e.g. export 2017 02")
    .action(async (year: string, month: string, accountId?: number) => {
        try {
            await kontist.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD);
            accountId = accountId || (await kontist.getAccounts())[0].id;
            const statement = await kontist.getStatement(accountId, year, month);
            process.stdout.write(statement);
        } catch (error) {
            console.error(error);
        }
    });

program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
