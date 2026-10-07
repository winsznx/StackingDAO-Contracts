import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// sDAO Tax
// ---------------------------------------------------------

export class Tax {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  shouldHandleTax(): ClarityValue {
    return simnet.callReadOnlyFn("tax-v1", "should-handle-tax", [], this.deployer).result;
  }

  getMinBalanceToHandle(): ClarityValue {
    return simnet.callReadOnlyFn(
      "tax-v1",
      "get-min-balance-to-handle",
      [],
      this.deployer,
    ).result;
  }

  getPercentageToSwap(): ClarityValue {
    return simnet.callReadOnlyFn("tax-v1", "get-percentage-to-swap", [], this.deployer).result;
  }

  checkJob(): ClarityValue {
    return simnet.callReadOnlyFn("tax-v1", "check-job", [], this.deployer).result;
  }

  initialize(caller: string): ClarityValue {
    return simnet.callPublicFn("tax-v1", "initialize", [], caller).result;
  }

  runJob(caller: string): ClarityValue {
    return simnet.callPublicFn("tax-v1", "run-job", [], caller).result;
  }

  handleTax(caller: string): ClarityValue {
    return simnet.callPublicFn("tax-v1", "handle-tax", [], caller).result;
  }

  retreiveStxTokens(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "tax-v1",
      "retreive-stx-tokens",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }

  retreiveTokens(caller: string, token: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "tax-v1",
      "retreive-tokens",
      [
        Cl.principal(qualifiedName(token)),
        Cl.uint(amount * 1_000_000),
        Cl.principal(receiver),
      ],
      caller,
    ).result;
  }

  setMinBalanceToHandle(caller: string, minBalance: number): ClarityValue {
    return simnet.callPublicFn(
      "tax-v1",
      "set-min-balance-to-handle",
      [Cl.uint(minBalance * 1_000_000)],
      caller,
    ).result;
  }

  setPercentageToSwap(caller: string, percentage: number): ClarityValue {
    return simnet.callPublicFn(
      "tax-v1",
      "set-percentage-to-swap",
      [Cl.uint(percentage * 10_000)],
      caller,
    ).result;
  }
}
