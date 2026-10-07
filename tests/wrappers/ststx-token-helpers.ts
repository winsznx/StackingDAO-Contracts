import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// stSTX token
// ---------------------------------------------------------

export class StStxToken {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getTotalSupply(): ClarityValue {
    return simnet.callReadOnlyFn("ststx-token", "get-total-supply", [], this.deployer).result;
  }

  getName(): ClarityValue {
    return simnet.callReadOnlyFn("ststx-token", "get-name", [], this.deployer).result;
  }

  getSymbol(): ClarityValue {
    return simnet.callReadOnlyFn("ststx-token", "get-symbol", [], this.deployer).result;
  }

  getDecimals(): ClarityValue {
    return simnet.callReadOnlyFn("ststx-token", "get-decimals", [], this.deployer).result;
  }

  getBalance(account: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststx-token",
      "get-balance",
      [Cl.principal(account)],
      this.deployer,
    ).result;
  }

  getTokenUri(): ClarityValue {
    return simnet.callReadOnlyFn("ststx-token", "get-token-uri", [], this.deployer).result;
  }

  transfer(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststx-token",
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
      "ststx-token",
      "set-token-uri",
      [Cl.stringUtf8(uri)],
      caller,
    ).result;
  }

  mintForProtocol(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststx-token",
      "mint-for-protocol",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }

  burnForProtocol(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststx-token",
      "burn-for-protocol",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }

  burn(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "ststx-token",
      "burn",
      [Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }
}
