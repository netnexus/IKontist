#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config();
import { KontistClient } from "../kontist-client";
const kontist = new KontistClient();
import { Command } from "commander";

const program = new Command();

program
    .command("list [accountId]")
    .description("list all transfers")
    .action(async (accountId?: number) => {
        try {
            await kontist.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD);
            accountId = accountId || (await kontist.getAccounts())[0].id;
            const transactions = kontist.getTransfers(accountId);
            process.stdout.write(JSON.stringify(transactions, null, 4));
        } catch (error) {
            console.error(error);
        }
    });

program
    .command("init <recipient> <iban> <amount> <note> [accountId]")
    .description("initiate a transfer, amount is EUR in cents")
    .action(async (recipient, iban, amount, note, accountId?: number) => {
        try {
            await kontist.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD);
            accountId = accountId || (await kontist.getAccounts())[0].id;
            const result = await kontist.initiateTransfer(accountId, recipient, iban, +amount, note);
            process.stdout.write(JSON.stringify(result, null, 4));
        } catch (error) {
            console.error(error);
        }
    });

program
    .command("confirm <transferId> <token> <recipient> <iban> <amount> <note> [accountId]")
    .description("confirm a transfer, use transferId from init call and token from sms")
    .action(async (transferId, token, recipient, iban, amount, note, accountId) => {
        try {
            await kontist.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD);
            accountId = accountId || (await kontist.getAccounts())[0].id;
            const result = await kontist.confirmTransfer(accountId, transferId, token, recipient, iban, +amount, note);
            process.stdout.write(JSON.stringify(result, null, 4));
        } catch (error) {
            console.error(error);
        }
    });

program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
