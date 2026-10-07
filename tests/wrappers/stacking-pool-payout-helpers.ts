import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// Stacking Pool Payout Helpers
// ---------------------------------------------------------

export class StackingPoolPayout {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getLastRewardId(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-pool-payout-v1",
      "get-last-reward-id",
      [],
      this.deployer,
    ).result;
  }

  getRewardsInfo(rewardsId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-pool-payout-v1",
      "get-rewards-info",
      [Cl.uint(rewardsId)],
      this.deployer,
    ).result;
  }

  getTotalStacked(cycle: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-pool-payout-v1",
      "get-total-stacked",
      [Cl.uint(cycle)],
      this.deployer,
    ).result;
  }

  getUserStacked(user: string, cycle: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-pool-payout-v1",
      "get-user-stacked",
      [Cl.principal(user), Cl.uint(cycle)],
      this.deployer,
    ).result;
  }

  depositRewards(caller: string, amount: number, cycle: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-payout-v1",
      "deposit-rewards",
      [Cl.uint(amount * 1_000_000), Cl.uint(cycle)],
      caller,
    ).result;
  }

  distributeRewards(caller: string, users: string[], rewardId: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-payout-v1",
      "distribute-rewards",
      [Cl.list(users.map((user) => Cl.principal(user))), Cl.uint(rewardId)],
      caller,
    ).result;
  }

  getStx(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-payout-v1",
      "get-stx",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }
}
