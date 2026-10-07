import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// Staking
// ---------------------------------------------------------

export class Staking {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getStakeOf(staker: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "staking-v1",
      "get-stake-of",
      [Cl.principal(staker)],
      this.deployer,
    ).result;
  }

  getStakeAmountOf(staker: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "staking-v1",
      "get-stake-amount-of",
      [Cl.principal(staker)],
      this.deployer,
    ).result;
  }

  getStakeCummRewardPerStakeOf(staker: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "staking-v1",
      "get-stake-cumm-reward-per-stake-of",
      [Cl.principal(staker)],
      this.deployer,
    ).result;
  }

  getTotalStaked(): ClarityValue {
    return simnet.callReadOnlyFn(
      "staking-v1",
      "get-total-staked",
      [],
      this.deployer,
    ).result;
  }

  getCummRewardPerStake(): ClarityValue {
    return simnet.callReadOnlyFn(
      "staking-v1",
      "get-cumm-reward-per-stake",
      [],
      this.deployer,
    ).result;
  }

  getLastRewardIncreaseBlock(): ClarityValue {
    return simnet.callReadOnlyFn(
      "staking-v1",
      "get-last-reward-increase-block",
      [],
      this.deployer,
    ).result;
  }

  getRewardsPerBlock(): ClarityValue {
    return simnet.callReadOnlyFn(
      "staking-v1",
      "get-rewards-per-block",
      [],
      this.deployer,
    ).result;
  }

  getRewardsEndBlock(): ClarityValue {
    return simnet.callReadOnlyFn(
      "staking-v1",
      "get-rewards-end-block",
      [],
      this.deployer,
    ).result;
  }

  stake(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "staking-v1",
      "stake",
      [Cl.principal(qualifiedName("sdao-token")), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  unstake(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "staking-v1",
      "unstake",
      [Cl.principal(qualifiedName("sdao-token")), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  getPendingRewards(staker: string): ClarityValue {
    // get-pending-rewards is defined as public. callPublicFn mines a block, so
    // the value observed is "one block ahead" — which matches the semantics of
    // the old Deno clarinet's callReadOnlyFn on public functions.
    return simnet.callPublicFn(
      "staking-v1",
      "get-pending-rewards",
      [Cl.principal(staker)],
      this.deployer,
    ).result;
  }

  claimPendingRewards(caller: string): ClarityValue {
    return simnet.callPublicFn("staking-v1", "claim-pending-rewards", [], caller).result;
  }

  increaseCummRewardPerStake(caller: string): ClarityValue {
    return simnet.callPublicFn(
      "staking-v1",
      "increase-cumm-reward-per-stake",
      [],
      caller,
    ).result;
  }

  calculateCummRewardPerStake(caller: string): ClarityValue {
    return simnet.callPublicFn(
      "staking-v1",
      "calculate-cumm-reward-per-stake",
      [],
      caller,
    ).result;
  }

  addRewards(caller: string, amount: number, endBlock: number): ClarityValue {
    return simnet.callPublicFn(
      "staking-v1",
      "add-rewards",
      [Cl.uint(amount * 1_000_000), Cl.uint(endBlock)],
      caller,
    ).result;
  }
}
