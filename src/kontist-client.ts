import { Client } from "node-rest-client";
const BASE_URL = "https://api.kontist.com/api/";

export class KontistClient extends Client {
    private token: string;

    /**
     * Return information for logged in user. (via constructor {user: "", password: ""} parameters)
     */
    public getUser(): Promise<any> {
        return this.request("user");
    }

    /**
     * Return list of accounts.
     */
    public getAccounts(): Promise<any> {
        return this.request("accounts");
    }

    /**
     * Return list of transactions.
     * @param {number} accountId
     */
    public getTransactions(accountId: number): Promise<any> {
        return this.request(`accounts/${accountId}/transactions`);
    }

    /**
     * Return list of transfers.
     * @param {number} accountId
     */
    public getTransfers(accountId: number): Promise<any> {
        return this.request(`accounts/${accountId}/transfer`);
    }

    /**
     * Create a new transfer, needs to be confirmed with the ´confirmTransfer` method and a
     * authorizationToken (you will receive via sms).
     * @param {number} accountId
     * @param {string} recipient
     * @param {string} iban
     * @param {number} amount cents
     * @param {string} note
     */
    public initiateTransfer(accountId: number,
                            recipient: string, iban: string, amount: number, note: string): Promise<any> {
        return this.request(`accounts/${accountId}/transfer`, "post", { recipient, iban, amount, note });
    }

    /**
     * Confirm a transfer with the same parameters as used in `initiateTransfer` and additionally
     * the id returned by the latter and a token provided usually via sms.
     * @param {number} accountId
     * @param {string} transferId
     * @param {string} authorizationToken
     * @param {string} recipient
     * @param {string} iban
     * @param {number} amount cents
     * @param {string} note
     */
    public confirmTransfer( accountId: number,
                            transferId: string,
                            authorizationToken: string,
                            recipient: string, iban: string, amount: number, note: string): Promise<any> {
        return this.request(`accounts/${accountId}/transfer/${transferId}`,
            "put", { authorizationToken, recipient, iban, amount, note });
    }

    /**
     * Return a pdf statement.
     */
    public getStatement(year: string, month: string): Promise<any> {
        return this.request(`user/statements/${year}/${month}`);
    }

    /**
     * Return a promise with a jwt token.
     *
     * @param email
     * @param password
     */
    public async login(email: string, password: string): Promise<string> {
        const result = await this.request("user/auth-token", "post", {email, password});
        this.token = result.token;
        return this.token;
    }

    /**
     * Helper to create promise with call to an endpoint.
     *
     * @param {string} endpoint
     * @param {string} method = get
     * @param {*} data
     */
    private request(endpoint: string, method = "get", data?: any): Promise<any> {
        const headers: any = { "Content-Type": "application/json" };
        if (this.token) {
            headers.Authorization = "Bearer " + this.token;
        }
        return new Promise((resolve, reject) => {
            this[method](BASE_URL + endpoint, {
                data, headers, requestConfig: { followRedirects: false },
            }, (result, raw) => this.handleResponse(result, raw, resolve, reject))
                .on("error", (err) => reject(err));
        });
    }

    /**
     * Calls rejecter when response has invalid status, calls resolver(data) if status is valid.
     *
     * @param {*} data
     * @param {*} response
     * @param {*} resolver
     * @param {*} rejecter
     */
    private async handleResponse(data: any, response: any,
                                 resolver: (data: any) => void, rejecter: (error: Error) => void): Promise<any> {
        if (response.statusCode === 302) {
            // manually redirect (w/o headers) to avoid problems an S3 when multiple Auth params are send.
            // tslint:disable-next-line:no-string-literal
            return await this["get"](response.headers.location, {},
                (result, raw) => this.handleResponse(result, raw, resolver, rejecter))
                .on("error", (err) => rejecter(err));
        }
        if (response.statusCode < 200 || response.statusCode > 299) {
            console.debug(response);
            rejecter(new Error(response.statusMessage));
        }
        resolver(data);
    }
}
