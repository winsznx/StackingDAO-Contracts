import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// Commission BTC
// ---------------------------------------------------------

export class CommissionBtc {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getStakingBasisPoints(): ClarityValue {
    return simnet.callReadOnlyFn(
      "commission-btc-v1",
      "get-staking-basispoints",
      [],
      this.deployer,
    ).result;
  }

  getCycleRewardsEndBlock(): ClarityValue {
    return simnet.callReadOnlyFn(
      "commission-btc-v1",
      "get-cycle-rewards-end-block",
      [],
      this.deployer,
    ).result;
  }

  addCommission(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "commission-btc-v1",
      "add-commission",
      [Cl.principal(qualifiedName("staking-v1")), Cl.uint(amount * 100_000_000)],
      caller,
    ).result;
  }

  withdrawCommission(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "commission-btc-v1",
      "withdraw-commission",
      [Cl.uint(amount * 100_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }

  setStakingBasisPoints(caller: string, percentage: number): ClarityValue {
    return simnet.callPublicFn(
      "commission-btc-v1",
      "set-staking-basispoints",
      [Cl.uint(percentage * 10_000)],
      caller,
    ).result;
  }
}
