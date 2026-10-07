import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// Commission
// ---------------------------------------------------------

export class Commission {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getStakingBasisPoints(): ClarityValue {
    return simnet.callReadOnlyFn(
      "commission-v2",
      "get-staking-basispoints",
      [],
      this.deployer,
    ).result;
  }

  getCycleRewardsEndBlock(): ClarityValue {
    return simnet.callReadOnlyFn(
      "commission-v2",
      "get-cycle-rewards-end-block",
      [],
      this.deployer,
    ).result;
  }

  addCommission(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "commission-v2",
      "add-commission",
      [Cl.principal(qualifiedName("staking-v1")), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  withdrawCommission(caller: string): ClarityValue {
    return simnet.callPublicFn("commission-v2", "withdraw-commission", [], caller).result;
  }

  setStakingBasisPoints(caller: string, percentage: number): ClarityValue {
    return simnet.callPublicFn(
      "commission-v2",
      "set-staking-basispoints",
      [Cl.uint(percentage * 10_000)],
      caller,
    ).result;
  }
}
