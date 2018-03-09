#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config();
import { KontistClient } from "../kontist-client";
const kontist = new KontistClient();
import * as fs from "async-file";
import { Command } from "commander";

const tmpFile = ".transfer-tmp.json";
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
            // tslint:disable-next-line:no-console
            console.error(error);
        }
    });

program
    .command("init <recipient> <iban> <amount> <note> [accountId]")
    .description("initiate a transfer, amount is EUR in cents")
    .option("-a, --auto", "Read pin from imessages and auto confirm (requires macOS)")
    .action(async (recipient, iban, amount, note, accountId: number, options: any) => {
        try {
            await kontist.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD);
            accountId = accountId || (await kontist.getAccounts())[0].id;
            let requested = false;
            if (options.auto) {
                try {
                    const imessage = require("osa-imessage");
                    imessage.listen().on("message", async (msg) => {
                        if (requested && msg.handle === "solarisbank" && msg.text.match(iban) !== null) {
                            const token = msg.text.match(/: (.*)\./)[1];
                            const transferId = result.links.self.split("/").slice(-1);
                            const confirmResult = await kontist.confirmTransfer(accountId,
                                transferId, token, recipient, iban, +amount, note);
                            process.stdout.write(JSON.stringify(confirmResult, null, 4));
                            process.exit();
                        }
                    });
                } catch (e) {
                    // tslint:disable-next-line:no-console
                    console.error("'--auto' only works on a mac and with osa-imessage installed (npm i osa-imessage)");
                    return;
                }
            }

            const result = await kontist.initiateTransfer(accountId, recipient, iban, +amount, note);
            requested = true; // we only want to look at the new incoming iMessages.
            process.stdout.write(JSON.stringify(result, null, 4));

            if (!options.auto) {
                // save tmp file for confirm
                await fs.writeFile(tmpFile, JSON.stringify({ ...result, accountId }), "utf8");
            }
        } catch (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
        }
    });

program
    .command("confirm <token> [transferId] [recipient] [iban] [amount] [note] [accountId]")
    .description("confirm a transfer, use values from previous init call or or give explicitly")
    .action(async (token, transferId, recipient, iban, amount, note, accountId) => {
        try {
            // restore data from tmp file
            try {
                const data = await fs.readFile(tmpFile, "utf8");
                const json = JSON.parse(data);
                transferId = json.links.self.split("/").slice(-1);
                recipient = recipient || json.recipient;
                iban = iban || json.iban;
                amount = amount || json.amount;
                note = note || json.note;
                accountId = accountId || json.accountId;
            } catch (e) {
                // tslint:disable-next-line:no-console
                console.error(e);
            }

            await kontist.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD);
            accountId = accountId || (await kontist.getAccounts())[0].id;
            const result = await kontist.confirmTransfer(accountId, transferId, token, recipient, iban, +amount, note);
            process.stdout.write(JSON.stringify(result, null, 4));
            await fs.unlink(tmpFile);
        } catch (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
        }
    });

program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
