# IKontist
This repository is not an official repository of the Kontist GmbH.
It connects to a currently undocumented REST API.

[![Build Status](https://travis-ci.org/netnexus/IKontist.svg?branch=master)](https://travis-ci.org/netnexus/IKontist)

## What does it do?
We provide 
1. a command line tool and
2. a JavaScript API.

Currently it can fetch transactions, transfers, statements and can create and confirm new transfers.

Please note that this project is in a early stage and support is welcome.

## How to use the CLI
### Prerequisites
* [node](https://nodejs.org) and npm installed
* Install with `npm install @netnexus/ikontist`
* Add your Kontist username and password either to ENVs called `KONTIST_USER` and `KONTIST_PASSWORD` or a .env file (just rename `.env-template` to `.env` and replace the credentials).

### Examples
```bash
node cli.js transaction list json
```

will return
```
[
    {
        "amount": 100,
        "booking_date": "2016-12-16T00:00:00.000Z",
        "booking_type": "SEPA_CREDIT_TRANSFER",
        "category": null,
        "date": "2016-12-16T00:00:00.000Z",
        "debitoor_invoice_id": null,
        "debitoor_invoice_number": null,
        "e2e_id": "NOTPROVIDED",
        "foreign_currency": null,
        "from": null,
        "iban": "DEXXXXX",
        "id": 4711,
        "name": "Foo, Bar",
        "original_amount": null,
        "pending_from": null,
        "purpose": "Fancy Friday, Baby",
        "to": 3214,
        "type": null,
        "valuta_date": "2016-12-16T00:00:00.000Z",
        "paymentMethod": "bank_account"
    },
    ...
]
```

```bash
node cli.js transaction list qif
```

will return
```
!Type:Bank
D8/2/2017
T8199
PExample GmbH
MRNr. ABC
^
D8/2/2017
T2142
PExample
Mdescription
^
```

So an easy way to create a qif export would be:
```bash
node cli.js transaction list qif > my-account.qif
```

To start a transfer you can use `transfer init` and `transfer confirm`:
```bash
# init transfer of 1€ to John Doe
node cli.js transfer init "John Doe" DE89370400440532013000 100 "test description"

# wait for sms with token (e.g. 252899)
node cli.js transfer confirm 252899
```

On macOS you can even use the `--auto` option with `init` to poll iMessages for the tan and automatically confirm the transfer:

```bash
# init and auto confirm transfer of 1€ to John Doe
node cli.js transfer init "John Doe" DE89370400440532013000 100 "test description" --auto
```

See more commands with 

```bash
node cli.js --help
```

## How to use the API

After instantiation of the class you need to login with your Kontist username and password, e.g.

    const KontistClient = require("kontist-client");
    const client = new KontistClient();
    client.login(process.env.KONTIST_USER, process.env.KONTIST_PASSWORD).then(function() {
        // do further calls to kontist here
    })

Of course you can use import instead of require:
    import { KontistClient } from "@netnexus/ikontist";
    const client = new KontistClient();

Please have a look at the `kontist-client.js`. Currently it provides methods for the following endpoints:

    login(email, password)
    getUser()
    getAccounts()
    getTransactions(accountId)
    getTransfers(accountId)
    initiateTransfer(accountId, recipient, iban, amount, note)
    confirmTransfer(accountId, transferId, authorizationToken, recipient, iban, amount, note)
    getStatement(accountId, year, month)

