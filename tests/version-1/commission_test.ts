import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { uintWithDecimals } from "../wrappers/tests-utils";
import { CoreV1 as Core } from "../wrappers/stacking-dao-core-helpers";
import { Commission } from "../wrappers/commission-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Core
//-------------------------------------

describe("commission", () => {
  it("commission: can add and withdraw commission", () => {
    const core = new Core(deployer);
    const commission = new Commission(deployer);

    expect(commission.setStakingBasisPoints(deployer, 0.8)).toBeOk(Cl.bool(true));

    expect(core.getStxBalance(wallet_1)).toBeUint(uintWithDecimals(100000000).value);

    expect(commission.addCommission(wallet_1, 5000)).toBeOk(uintWithDecimals(5000));

    expect(core.getStxBalance(wallet_1)).toBeUint(uintWithDecimals(99995000).value);

    expect(core.getStxBalance(deployer)).toBeUint(uintWithDecimals(100000000).value);

    // Can withdraw 20% of total commission
    // 20% of 5000 STX = 1000 STX
    expect(commission.withdrawCommission(deployer)).toBeOk(uintWithDecimals(1000));

    expect(core.getStxBalance(deployer)).toBeUint(uintWithDecimals(100001000).value);
  });

  it("commission: can set staking percentage", () => {
    const commission = new Commission(deployer);

    expect(commission.setStakingBasisPoints(deployer, 0.8)).toBeOk(Cl.bool(true));

    expect(commission.addCommission(wallet_1, 5000)).toBeOk(uintWithDecimals(5000));

    // Can withdraw 20% of total commission
    // 20% of 5000 STX = 1000 STX
    expect(commission.withdrawCommission(deployer)).toBeOk(uintWithDecimals(1000));

    expect(commission.setStakingBasisPoints(deployer, 0.7)).toBeOk(Cl.bool(true));

    expect(commission.addCommission(wallet_1, 5000)).toBeOk(uintWithDecimals(5000));

    // Can withdraw 30% of total commission
    // 30% of 5000 STX = 1500 STX
    expect(commission.withdrawCommission(deployer)).toBeOk(uintWithDecimals(1500));
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("commission: can not set staking percentage below minimum", () => {
    const commission = new Commission(deployer);

    expect(commission.setStakingBasisPoints(deployer, 0.6)).toBeErr(Cl.uint(29001));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("commission: only protocol can withdraw commission", () => {
    const commission = new Commission(deployer);

    expect(commission.withdrawCommission(wallet_1)).toBeErr(Cl.uint(20003));
  });

  it("commission: only protocol can set staking percentage", () => {
    const commission = new Commission(deployer);

    expect(commission.setStakingBasisPoints(wallet_1, 10)).toBeErr(Cl.uint(20003));
  });
});
