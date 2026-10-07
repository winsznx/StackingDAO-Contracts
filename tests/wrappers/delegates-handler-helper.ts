import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// Delegate Handler Helpers
// ---------------------------------------------------------

export class DelegatesHandler {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getLastSelectedPool(delegate: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "delegates-handler-v1",
      "get-last-selected-pool",
      [Cl.principal(delegate)],
      this.deployer,
    ).result;
  }

  getTargetLockedAmount(delegate: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "delegates-handler-v1",
      "get-target-locked-amount",
      [Cl.principal(delegate)],
      this.deployer,
    ).result;
  }

  getLastLockedAmount(delegate: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "delegates-handler-v1",
      "get-last-locked-amount",
      [Cl.principal(delegate)],
      this.deployer,
    ).result;
  }

  getLastUnlockedAmount(delegate: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "delegates-handler-v1",
      "get-last-unlocked-amount",
      [Cl.principal(delegate)],
      this.deployer,
    ).result;
  }

  getStxAccount(user: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "delegates-handler-v1",
      "get-stx-account",
      [Cl.principal(user)],
      this.deployer,
    ).result;
  }

  calculateRewards(delegate: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "delegates-handler-v1",
      "calculate-rewards",
      [Cl.principal(delegate)],
      this.deployer,
    ).result;
  }

  calculateExcess(delegate: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "delegates-handler-v1",
      "calculate-excess",
      [Cl.principal(delegate)],
      this.deployer,
    ).result;
  }

  handleRewards(caller: string, delegate: string): ClarityValue {
    return simnet.callPublicFn(
      "delegates-handler-v1",
      "handle-rewards",
      [
        Cl.principal(delegate),
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("rewards-v3")),
      ],
      caller,
    ).result;
  }

  handleExcess(caller: string, delegate: string): ClarityValue {
    return simnet.callPublicFn(
      "delegates-handler-v1",
      "handle-excess",
      [Cl.principal(delegate), Cl.principal(qualifiedName("reserve-v1"))],
      caller,
    ).result;
  }

  revoke(caller: string, delegate: string): ClarityValue {
    return simnet.callPublicFn(
      "delegates-handler-v1",
      "revoke",
      [
        Cl.principal(delegate),
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("rewards-v3")),
      ],
      caller,
    ).result;
  }

  revokeAndDelegate(
    caller: string,
    delegate: string,
    amount: number,
    delegateTo: string,
    untilBurnHeight: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "delegates-handler-v1",
      "revoke-and-delegate",
      [
        Cl.principal(delegate),
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("rewards-v3")),
        Cl.uint(amount * 1_000_000),
        Cl.principal(delegateTo),
        Cl.uint(untilBurnHeight),
      ],
      caller,
    ).result;
  }

  updateAmounts(
    caller: string,
    delegate: string,
    targetLocked: number,
    lastLocked: number,
    lastUnlocked: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "delegates-handler-v1",
      "update-amounts",
      [
        Cl.principal(delegate),
        Cl.uint(targetLocked * 1_000_000),
        Cl.uint(lastLocked * 1_000_000),
        Cl.uint(lastUnlocked * 1_000_000),
      ],
      caller,
    ).result;
  }
}
