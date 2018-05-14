import { AxiosResponse, default as axios } from "axios";
const BASE_URL = "https://api.kontist.com";

export class KontistClient {
    private token: string;
    private axios = axios.create();

    /**
     * Return information for logged in user. (via constructor {user: "", password: ""} parameters)
     */
    public getUser(): Promise<any> {
        return this.request("/api/user");
    }

    /**
     * Return list of accounts.
     */
    public getAccounts(): Promise<any> {
        return this.request("/api/accounts");
    }

    /**
     * Return list of transactions.
     * @param {number} accountId
     * @param {number} limit
     */
    public async getTransactions(accountId: number, limit = Number.MAX_SAFE_INTEGER): Promise<any> {
        const transactions = await this.fetchAmount(`/api/accounts/${accountId}/transactions`, limit);
        // workaround to filter duplicates, as kontist sometimes returns the same object
        // as the last element of an page and the first of the next...
        return  transactions.filter((obj, pos, arr) => {
            return arr.map((mapObj) => mapObj.id).indexOf(obj.id) === pos;
        });
    }

    /**
     * Return list of future transactions.
     * @param {number} accountId
     * @param {number} limit
     */
    public async getFutureTransactions(accountId: number, limit = Number.MAX_SAFE_INTEGER): Promise<any> {
        return this.fetchAmount(`/api/accounts/${accountId}/future-transactions`, limit);
    }

    /**
     * Return list of transfers.
     * @param {number} accountId
     * @param {number} limit
     */
    public getTransfers(accountId: number, limit = Number.MAX_SAFE_INTEGER): Promise<any> {
        return this.fetchAmount(`/api/accounts/${accountId}/transfer`, limit);
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
    public initiateTransfer(
        accountId: number,
        recipient: string,
        iban: string,
        amount: number,
        note: string,
    ): Promise<any> {
        return this.request(`/api/accounts/${accountId}/transfer`, "post", { recipient, iban, amount, note });
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
    public confirmTransfer(
        accountId: number,
        transferId: string,
        authorizationToken: string,
        recipient: string,
        iban: string,
        amount: number,
        note: string,
    ): Promise<any> {
        return this.request(`/api/accounts/${accountId}/transfer/${transferId}`,
            "put", { authorizationToken, recipient, iban, amount, note });
    }

    /**
     * Return a pdf statement.
     */
    public getStatement(year: string, month: string): Promise<any> {
        return this.request(`/api/user/statements/${year}/${month}`);
    }

    /**
     * Return a promise with a jwt token.
     *
     * @param email
     * @param password
     */
    public async login(email: string, password: string): Promise<string> {
        this.token = null;
        const result = await this.request("/api/user/auth-token", "post", { email, password });
        this.token = result.token;
        return this.token;
    }

    /**
     * Fetch (unlimited) number of results.
     *
     * @param startUrl
     * @param limit
     */
    private async fetchAmount(startUrl: string, limit: number) {
        let total = limit;
        let next = startUrl;
        const results = [];
        while (results.length < Math.min(total, limit)) {
            const data = await this.request(next);
            total = data.total;
            next = data.next;
            results.push(...data.results);
        }
        return results.slice(0, limit);
    }

    /**
     * Helper to create promise with call to an endpoint.
     *
     * @param {string} endpoint
     * @param {string} method = get
     * @param {*} data
     */
    private request(endpoint: string, method = "get", data?: any): Promise<any> {
        const headers: any = {
            "Content-Type": "application/json",
            "accept": "application/vnd.kontist.transactionlist.v2+json",
        };
        this.axios.defaults.headers.common = {};
        if (this.token) {
            headers.Authorization = "Bearer " + this.token;
        }
        return new Promise((resolve, reject) => {
            this.axios({
                data,
                headers,
                maxRedirects: 0,
                method,
                url: BASE_URL + endpoint,
            })
                .then((result) => this.handleResponse(result, resolve, reject))
                .catch((err) => reject(err));
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
    private async handleResponse(
        result: AxiosResponse,
        resolver: (data: any) => void,
        rejecter: (error: Error) => void,
    ): Promise<any> {
        if (result.status === 302) {
            // manually redirect (w/o headers) to avoid problems an S3 when multiple Auth params are send.
            // tslint:disable-next-line:no-string-literal
            return this.axios({ method: "get", url: result.headers.location })
                .then((redirectedResult) => this.handleResponse(redirectedResult, resolver, rejecter))
                .catch((err) => rejecter(err));
        }
        if (result.status < 200 || result.status > 299) {
            // tslint:disable-next-line:no-console
            console.debug(result);
            rejecter(new Error(result.statusText));
        }
        resolver(result.data);
    }
}
