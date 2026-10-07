import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// sBTC token
// ---------------------------------------------------------

export class SBtcToken {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getTotalSupply(): ClarityValue {
    return simnet.callReadOnlyFn("sbtc-token", "get-total-supply", [], this.deployer).result;
  }

  getName(): ClarityValue {
    return simnet.callReadOnlyFn("sbtc-token", "get-name", [], this.deployer).result;
  }

  getSymbol(): ClarityValue {
    return simnet.callReadOnlyFn("sbtc-token", "get-symbol", [], this.deployer).result;
  }

  getDecimals(): ClarityValue {
    return simnet.callReadOnlyFn("sbtc-token", "get-decimals", [], this.deployer).result;
  }

  getBalance(account: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [Cl.principal(account)],
      this.deployer,
    ).result;
  }

  getTokenUri(): ClarityValue {
    return simnet.callReadOnlyFn("sbtc-token", "get-token-uri", [], this.deployer).result;
  }

  transfer(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "sbtc-token",
      "transfer",
      [
        Cl.uint(BigInt(amount) * 100_000_000n),
        Cl.principal(caller),
        Cl.principal(receiver),
        Cl.none(),
      ],
      caller,
    ).result;
  }

  protocolMint(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "sbtc-token",
      "protocol-mint",
      [Cl.uint(BigInt(amount) * 100_000_000n), Cl.principal(receiver)],
      caller,
    ).result;
  }

  protocolBurn(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "sbtc-token",
      "protocol-burn",
      [Cl.uint(BigInt(amount) * 100_000_000n), Cl.principal(receiver)],
      caller,
    ).result;
  }
}
