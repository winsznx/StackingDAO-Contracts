import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// stSTXbtc token V1
// ---------------------------------------------------------

export class StStxBtcTokenV1 {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getTotalSupply(): ClarityValue {
    return simnet.callReadOnlyFn("ststxbtc-token", "get-total-supply", [], this.deployer).result;
  }

  getName(): ClarityValue {
    return simnet.callReadOnlyFn("ststxbtc-token", "get-name", [], this.deployer).result;
  }

  getSymbol(): ClarityValue {
    return simnet.callReadOnlyFn("ststxbtc-token", "get-symbol", [], this.deployer).result;
  }

  getDecimals(): ClarityValue {
    return simnet.callReadOnlyFn("ststxbtc-token", "get-decimals", [], this.deployer).result;
  }

  getBalance(account: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-token",
      "get-balance",
      [Cl.principal(account)],
      this.deployer,
    ).result;
  }

  getTokenUri(): ClarityValue {
    return simnet.callReadOnlyFn("ststxbtc-token", "get-token-uri", [], this.deployer).result;
  }

  transfer(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-token",
      "transfer",
      [
        Cl.uint(amount * 1_000_000),
        Cl.principal(caller),
        Cl.principal(receiver),
        Cl.none(),
      ],
      caller,
    ).result;
  }

  setTokenUri(caller: string, uri: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-token",
      "set-token-uri",
      [Cl.stringUtf8(uri)],
      caller,
    ).result;
  }

  mintForProtocol(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-token",
      "mint-for-protocol",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }

  burnForProtocol(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-token",
      "burn-for-protocol",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }

  burn(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-token",
      "burn",
      [Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }
}

// ---------------------------------------------------------
// stSTXbtc token V2
// ---------------------------------------------------------

export class StStxBtcToken {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getTotalSupply(): ClarityValue {
    return simnet.callReadOnlyFn("ststxbtc-token-v2", "get-total-supply", [], this.deployer).result;
  }

  getName(): ClarityValue {
    return simnet.callReadOnlyFn("ststxbtc-token-v2", "get-name", [], this.deployer).result;
  }

  getSymbol(): ClarityValue {
    return simnet.callReadOnlyFn("ststxbtc-token-v2", "get-symbol", [], this.deployer).result;
  }

  getDecimals(): ClarityValue {
    return simnet.callReadOnlyFn("ststxbtc-token-v2", "get-decimals", [], this.deployer).result;
  }

  getBalance(account: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-token-v2",
      "get-balance",
      [Cl.principal(account)],
      this.deployer,
    ).result;
  }

  getTokenUri(): ClarityValue {
    return simnet.callReadOnlyFn("ststxbtc-token-v2", "get-token-uri", [], this.deployer).result;
  }

  transfer(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-token-v2",
      "transfer",
      [
        Cl.uint(amount * 1_000_000),
        Cl.principal(caller),
        Cl.principal(receiver),
        Cl.none(),
      ],
      caller,
    ).result;
  }

  setTokenUri(caller: string, uri: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-token-v2",
      "set-token-uri",
      [Cl.stringUtf8(uri)],
      caller,
    ).result;
  }

  mintForProtocol(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-token-v2",
      "mint-for-protocol",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }

  burnForProtocol(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-token-v2",
      "burn-for-protocol",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }

  burn(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-token-v2",
      "burn",
      [Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }
}
