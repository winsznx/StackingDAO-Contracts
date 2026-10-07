import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// Rewards
// ---------------------------------------------------------

export class Rewards {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getStStxCommissionContract(): ClarityValue {
    return simnet.callReadOnlyFn(
      "rewards-v5",
      "get-ststx-commission-contract",
      [],
      this.deployer,
    ).result;
  }

  getStStxBtcCommissionContract(): ClarityValue {
    return simnet.callReadOnlyFn(
      "rewards-v5",
      "get-ststxbtc-commission-contract",
      [],
      this.deployer,
    ).result;
  }

  getCycleRewardsStStx(cycle: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "rewards-v5",
      "get-cycle-rewards-ststx",
      [Cl.uint(cycle)],
      this.deployer,
    ).result;
  }

  getCycleRewardsStStxBtc(cycle: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "rewards-v5",
      "get-cycle-rewards-ststxbtc",
      [Cl.uint(cycle)],
      this.deployer,
    ).result;
  }

  getPoxCycle(): ClarityValue {
    return simnet.callReadOnlyFn(
      "rewards-v5",
      "get-pox-cycle",
      [],
      this.deployer,
    ).result;
  }

  addRewards(caller: string, pool: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "rewards-v5",
      "add-rewards",
      [Cl.principal(pool), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  addRewardsSBtc(caller: string, pool: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "rewards-v5",
      "add-rewards-sbtc",
      [Cl.principal(pool), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  shouldProcessRewards(cycle: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "rewards-v5",
      "should-process-rewards",
      [Cl.uint(cycle)],
      this.deployer,
    ).result;
  }

  processRewards(caller: string, cycle: number): ClarityValue {
    return simnet.callPublicFn(
      "rewards-v5",
      "process-rewards",
      [
        Cl.uint(cycle),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("commission-btc-v1")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.principal(qualifiedName("reserve-v1")),
      ],
      caller,
    ).result;
  }

  getStx(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "rewards-v5",
      "get-stx",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }

  getSBtc(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "rewards-v5",
      "get-sbtc",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }

  setStStxCommissionContract(caller: string, contract: string): ClarityValue {
    return simnet.callPublicFn(
      "rewards-v5",
      "set-ststx-commission-contract",
      [Cl.principal(contract)],
      caller,
    ).result;
  }

  setStStxBtcCommissionContract(caller: string, contract: string): ClarityValue {
    return simnet.callPublicFn(
      "rewards-v5",
      "set-ststxbtc-commission-contract",
      [Cl.principal(contract)],
      caller,
    ).result;
  }

  getRewardCycleLength(): ClarityValue {
    return simnet.callReadOnlyFn(
      "rewards-v5",
      "get-reward-cycle-length",
      [],
      this.deployer,
    ).result;
  }

  setRewardsIntervalLength(caller: string, interval: number): ClarityValue {
    return simnet.callPublicFn(
      "rewards-v5",
      "set-rewards-interval-length",
      [Cl.uint(interval)],
      caller,
    ).result;
  }

  getRewardsIntervalLength(): ClarityValue {
    return simnet.callReadOnlyFn(
      "rewards-v5",
      "get-rewards-interval-length",
      [],
      this.deployer,
    ).result;
  }
}
