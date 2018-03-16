import { expect } from "chai";
import "mocha";
import * as sinon from "sinon";

import { KontistClient } from "../../src/kontist-client";

describe("KontistClient", () => {
    let client: KontistClient;
    let sandbox: sinon.SinonSandbox;

    afterEach(() => {
        sandbox.restore();
    });
    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        client = new KontistClient();
    });

    describe("#getUser()", () => {
        it("should call correct endpoint", async () => {
            // arrange
            const spyOnRequest = sinon.stub(client as any, "request").returns(Promise.resolve({}));

            // act
            await client.getUser();

            // assert
            sinon.assert.calledWith(spyOnRequest, "/api/user");
        });
    });

    describe("#getAccounts()", () => {
        it("should call correct endpoint", async () => {
            // arrange
            const spyOnRequest = sinon.stub(client as any, "request").returns(Promise.resolve([{
                accountType: "solaris",
                balance: 12345,
                bankCode: "11010100",
                bankName: "solarisBank",
                hasFastbillId: false,
                hasInvalidCredentials: false,
                iban: "DE12345678901234567890",
                id: 1,
                meta: {},
            }]));

            // act
            const accounts = await client.getAccounts();

            // assert
            sinon.assert.calledWith(spyOnRequest, "/api/accounts");
            expect(accounts).length(1);
            expect(accounts[0]).to.eql({
                accountType: "solaris",
                balance: 12345,
                bankCode: "11010100",
                bankName: "solarisBank",
                hasFastbillId: false,
                hasInvalidCredentials: false,
                iban: "DE12345678901234567890",
                id: 1,
                meta: {},
            });
        });
    });

    describe("#getTransactions()", () => {
        it("should call correct endpoint", async () => {
            // arrange
            const spyOnRequest = sinon.stub(client as any, "request")
                .onFirstCall().resolves({
                    next: "/api/accounts/1/transactions?page=2",
                    results: [
                        {
                            amount: 123,
                        }],
                    total: 2,
                })
                .onSecondCall().resolves({
                    next: null,
                    results: [
                        {
                            amount: 345,
                        }],
                    total: 2,
                });

            // act
            const transactions = await client.getTransactions(1);

            // assert
            sinon.assert.calledWith(spyOnRequest, "/api/accounts/1/transactions");
            expect(transactions).to.eql([
                { amount: 123 }, { amount: 345 },
            ]);
        });
        it("should limit result", async () => {
            // arrange
            const spyOnRequest = sinon.stub(client as any, "request")
                .onFirstCall().resolves({
                    next: "/api/accounts/1/transactions?page=2",
                    results: [
                        {
                            amount: 123,
                        }],
                    total: 2,
                })
                .onSecondCall().resolves({
                    next: null,
                    results: [
                        {
                            amount: 345,
                        }],
                    total: 2,
                });

            // act
            const transactions = await client.getTransactions(1, 1);

            // assert
            sinon.assert.calledWith(spyOnRequest, "/api/accounts/1/transactions");
            expect(transactions).to.eql([
                { amount: 123 },
            ]);
        });
    });

    describe("#getFutureTransactions()", () => {
        it("should call correct endpoint", async () => {
            // arrange
            const spyOnRequest = sinon.stub(client as any, "request").resolves({
                next: null,
                results: [
                    {
                        amount: 123,
                    }],
                total: 1,
            });

            // act
            await client.getFutureTransactions(1);

            // assert
            sinon.assert.calledWith(spyOnRequest, "/api/accounts/1/future-transactions");
        });
    });

    describe("#getTransfers()", () => {
        it("should call correct endpoint", async () => {
            // arrange
            const spyOnRequest = sinon.stub(client as any, "request").resolves({
                next: null,
                results: [
                    {
                        amount: 123,
                    }],
                total: 1,
            });

            // act
            await client.getTransfers(1);

            // assert
            sinon.assert.calledWith(spyOnRequest, "/api/accounts/1/transfer");
        });
    });

    describe("#initiateTransfer()", () => {
        it("should call correct endpoint", async () => {
            // arrange
            const spyOnRequest = sinon.stub(client as any, "request").returns(Promise.resolve({}));

            // act
            await client.initiateTransfer(1, "mock recipient", "DE1234567890", 100, "mock");

            // assert
            sinon.assert.calledWith(spyOnRequest, "/api/accounts/1/transfer", "post",
                { recipient: "mock recipient", iban: "DE1234567890", amount: 100, note: "mock" });
        });
    });

    describe("#confirmTransfer()", () => {
        it("should call correct endpoint", async () => {
            // arrange
            const spyOnRequest = sinon.stub(client as any, "request").returns(Promise.resolve({}));

            // act
            await client.confirmTransfer(1, "tid", "token", "mock recipient", "DE1234567890", 100, "mock");

            // assert
            sinon.assert.calledWith(spyOnRequest, "/api/accounts/1/transfer/tid", "put",
                {
                    amount: 100,
                    authorizationToken: "token",
                    iban: "DE1234567890",
                    note: "mock",
                    recipient: "mock recipient",
                });
        });
    });

    describe("#getStatement()", () => {
        it("should call correct endpoint", async () => {
            // arrange
            const spyOnRequest = sinon.stub(client as any, "request").returns(Promise.resolve({}));

            // act
            await client.getStatement("2017", "02");

            // assert
            sinon.assert.calledWith(spyOnRequest, "/api/user/statements/2017/02");
        });
    });

    describe("#login()", () => {
        it("should call correct endpoint", async () => {
            // arrange
            const spyOnRequest = sinon.stub(client as any, "request").returns(Promise.resolve({}));

            // act
            await client.login("user", "password");

            // assert
            sinon.assert.calledWith(spyOnRequest, "/api/user/auth-token", "post",
                { email: "user", password: "password" });
        });
    });

    describe("#request", () => {
        it("should create request", async () => {
            // arrange
            const spyOnGet = sinon.stub(client as any, "get").returns({ on: () => false });
            spyOnGet.callsArgWith(2, null, { statusCode: 200 });

            // act
            await client.getUser();

            // assert
            sinon.assert.calledWith(
                spyOnGet,
                "https://api.kontist.com/api/user",
                {
                    data: undefined,
                    headers: {
                        "Content-Type": "application/json",
                        "accept": "application/vnd.kontist.transactionlist.v2+json",
                    },
                    requestConfig: { followRedirects: false },
                },
                sinon.match.any,
            );
        });
        it("should add Authorization header after login", async () => {
            // arrange
            const spyOnGet = sinon.stub(client as any, "get").returns({ on: () => false });
            spyOnGet.callsArgWith(2, null, { statusCode: 200 });
            Object.assign(client, { token: "TEST-TOKEN" });

            // act
            await client.getUser();

            // assert
            sinon.assert.calledWith(
                spyOnGet,
                "https://api.kontist.com/api/user",
                {
                    data: undefined,
                    headers: {
                        "Authorization": "Bearer TEST-TOKEN",
                        "Content-Type": "application/json",
                        "accept": "application/vnd.kontist.transactionlist.v2+json",
                    },
                    requestConfig: { followRedirects: false },
                },
                sinon.match.any,
            );
        });
    });

    describe("#handleResponse", () => {
        it("should handle valid response", async () => {
            // arrange
            const resolveCallback = sinon.spy();
            const spyOnGet = sinon.stub(client as any, "get").returns({ on: () => false });
            spyOnGet.callsArgWith(2, { mock: "test" }, { statusCode: 200 }, resolveCallback);

            // act
            await client.getUser();

            // assert
            resolveCallback.calledWith({ mock: "test" });
        });
        it("should handle invalid response", async () => {
            // arrange
            const rejectCallback = sinon.spy();
            const spyOnGet = sinon.stub(client as any, "get").returns({ on: () => false });
            spyOnGet.callsArgWith(2, { mock: "test" },
                { statusCode: 400, statusMessage: "mock" }, null, rejectCallback);

            // act
            try {
                await client.getUser();
                throw new Error("client.getUser should have thrown an error");
            } catch (e) {
                expect(e).to.be.instanceof(Error);
                expect(e.message).to.eql("mock");
            }
        });
        it("should handle invalid network response", async () => {
            // arrange
            const on = sinon.stub();
            sinon.stub(client as any, "get").returns({ on });
            on.callsArgWith(1, new Error("network outage"));

            // act
            try {
                await client.getUser();
                throw new Error("client.getUser should have thrown an error");
            } catch (e) {
                expect(e).to.be.instanceof(Error);
                expect(e.message).to.eql("network outage");
            }
        });
    });
});
