import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// Fast Pool V2
// ---------------------------------------------------------

export class FastPoolV2 {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getStxAccount(user: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "pox-fast-pool-v2-mock",
      "get-stx-account",
      [Cl.principal(user)],
      this.deployer,
    ).result;
  }

  getLockedInfoUser(user: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "pox-fast-pool-v2-mock",
      "get-locked-info-user",
      [Cl.principal(user)],
      this.deployer,
    ).result;
  }

  notLockedForCycle(unlockBurnHeight: number, cycle: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "pox-fast-pool-v2-mock",
      "not-locked-for-cycle",
      [Cl.uint(unlockBurnHeight), Cl.uint(cycle)],
      this.deployer,
    ).result;
  }

  delegateStx(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "pox-fast-pool-v2-mock",
      "delegate-stx",
      [Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  delegateStackStx(caller: string, user: string): ClarityValue {
    return simnet.callPublicFn(
      "pox-fast-pool-v2-mock",
      "delegate-stack-stx",
      [Cl.principal(user)],
      caller,
    ).result;
  }

  delegateStackStxMany(caller: string, users: string[]): ClarityValue {
    return simnet.callPublicFn(
      "pox-fast-pool-v2-mock",
      "delegate-stack-stx-many",
      [Cl.list(users.map((u) => Cl.principal(u)))],
      caller,
    ).result;
  }
}
