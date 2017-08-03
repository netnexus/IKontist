#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config();
import { KontistClient } from "../kontist-client";
const kontist = new KontistClient();
import { Command } from "commander";

const program = new Command();
const FORMAT_JSON = "json";
const FORMAT_QIF = "qif";

program
    .command("list [format] [accountId]")
    .description("format can be json or qif")
    .action(async (format = FORMAT_JSON, accountId?: number) => {
        try {
            await kontist.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD);
            accountId = accountId || (await kontist.getAccounts())[0].id;
            const transactions = await kontist.getTransactions(accountId);
            switch (format) {
                case FORMAT_JSON: {
                    process.stdout.write(JSON.stringify(transactions, null, 4));
                    break;
                }
                case FORMAT_QIF: {
                    const qif = require("qif-writer");
                    const data = transactions.map((row) => ({
                        amount: row.amount / 100,
                        date: new Date(row.date).toLocaleDateString("en-US"),
                        memo: row.purpose,
                        payee: row.name,
                    }));
                    qif.write(data, { type: "Bank" });
                    break;
                }
                default:
                    throw new Error("Unknown format " + format);
            }
        } catch (error) {
            console.error(error);
        }
    });

program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
