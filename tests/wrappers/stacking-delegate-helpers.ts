import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// Stacking Delegate Helpers
// ---------------------------------------------------------

export class StackingDelegate {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getStxAccount(user: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-delegate-1-1",
      "get-stx-account",
      [Cl.principal(user)],
      this.deployer,
    ).result;
  }

  delegateStx(
    caller: string,
    delegate: string,
    amount: number,
    delegateTo: string,
    untilBurnHeight: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      delegate,
      "delegate-stx",
      [
        Cl.uint(amount * 1_000_000),
        Cl.principal(delegateTo),
        Cl.some(Cl.uint(untilBurnHeight)),
      ],
      caller,
    ).result;
  }

  revokeDelegateStx(caller: string, delegate: string): ClarityValue {
    return simnet.callPublicFn(delegate, "revoke-delegate-stx", [], caller).result;
  }

  requestStxToStack(caller: string, delegate: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      delegate,
      "request-stx-to-stack",
      [Cl.principal(qualifiedName("reserve-v1")), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  returnStxFromStacking(caller: string, delegate: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      delegate,
      "return-stx-from-stacking",
      [Cl.principal(qualifiedName("reserve-v1")), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  handleRewards(
    caller: string,
    delegate: string,
    pool: string,
    rewards: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      delegate,
      "handle-rewards",
      [
        Cl.principal(pool),
        Cl.uint(rewards * 1_000_000),
        Cl.principal(qualifiedName("rewards-v3")),
      ],
      caller,
    ).result;
  }

  returnStx(caller: string, delegate: string): ClarityValue {
    return simnet.callPublicFn(
      delegate,
      "return-stx",
      [Cl.principal(qualifiedName("reserve-v1"))],
      caller,
    ).result;
  }
}
