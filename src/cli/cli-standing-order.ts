#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config();
import { KontistClient } from "../kontist-client";
const kontist = new KontistClient();
import * as fs from "async-file";
import { Command } from "commander";

const tmpFile = ".standing-order-tmp.json";
const program = new Command();

program
    .command("list [format] [accountId]")
    .description("list standing orders")
    .action(async (accountId?: number) => {
        try {
            await kontist.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD);
            accountId = accountId || (await kontist.getAccounts())[0].id;
            const standingOrders = await kontist.getStandingOrders(accountId);
            process.stdout.write(JSON.stringify(standingOrders, null, 4));
        } catch (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
        }
    });

    program
    .command("init <recipient> <iban> <amount> <note> <reoccurrence> <start> [accountId]")
    .description("initiate a standing order, amount is EUR in cents")
    .option("-a, --auto", "Read pin from imessages and auto confirm (requires macOS)")
    .action(async (recipient, iban, amount, note, reoccurrence, start, accountId: number, options: any) => {
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
                            const requestId = result.requestId;
                            const confirmResult = await kontist.confirmStandingOrder(accountId, requestId, token);
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

            const result = await kontist.initiateStandingOrder(accountId, recipient, iban, +amount, note, reoccurrence, start);
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
    .command("confirm <token> [requestId] [accountId]")
    .description("confirm a standing order, use values from previous init call or or give explicitly")
    .action(async (token, requestId, accountId) => {
        try {
            // restore data from tmp file
            try {
                const data = await fs.readFile(tmpFile, "utf8");
                const json = JSON.parse(data);
                requestId = requestId || json.requestId;
                accountId = accountId || json.accountId;
            } catch (e) {
                // tslint:disable-next-line:no-console
                console.error(e);
            }

            await kontist.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD);
            accountId = accountId || (await kontist.getAccounts())[0].id;
            const result = await kontist.confirmStandingOrder(accountId, requestId, token);
            process.stdout.write(JSON.stringify(result, null, 4));
            await fs.unlink(tmpFile);
        } catch (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
        }
    });


program
.command("cancel <standingOrderId> [accountId]")
.description("cancel a standing order")
.option("-a, --auto", "Read pin from imessages and auto confirm (requires macOS)")
.action(async (standingOrderId, accountId: number, options: any) => {
    try {
        await kontist.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD);
        accountId = accountId || (await kontist.getAccounts())[0].id;
        let requested = false;
        if (options.auto) {
            try {
                const imessage = require("osa-imessage");
                imessage.listen().on("message", async (msg) => {
                    if (requested && msg.handle === "solarisbank") {
                        const token = msg.text.match(/: (.*)\./)[1];
                        const requestId = result.requestId;
                        const confirmResult = await kontist.confirmStandingOrder(accountId, requestId, token);
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

        const result = await kontist.initCancelStandingOrder(accountId, standingOrderId);
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


program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
