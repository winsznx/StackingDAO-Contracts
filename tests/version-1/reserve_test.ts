import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { uintWithDecimals } from "../wrappers/tests-utils";
import { CoreV1 as Core } from "../wrappers/stacking-dao-core-helpers";
import { Reserve } from "../wrappers/reserve-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Core
//-------------------------------------

describe("reserve", () => {
  it("reserve: lock and request STX for withdrawal", () => {
    const reserve = new Reserve(deployer);
    const core = new Core(deployer);

    // Add 1000 STX to reserve
    expect(core.deposit(deployer, 1000)).toBeOk(uintWithDecimals(1000));

    expect(reserve.getStxBalance()).toBeOk(uintWithDecimals(1000));

    expect(reserve.getStxStacking()).toBeOk(uintWithDecimals(0));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000));

    expect(core.getStxBalance(wallet_1)).toBeUint(uintWithDecimals(100000000).value);

    // Lock 200 STX for withdrawal
    expect(reserve.lockStxForWithdrawal(deployer, 200)).toBeOk(uintWithDecimals(200));

    // Request 200 STX for wallet_1
    expect(reserve.requestStxForWithdrawal(deployer, 200, wallet_1)).toBeOk(uintWithDecimals(200));

    expect(reserve.getStxBalance()).toBeOk(uintWithDecimals(800));

    expect(reserve.getStxStacking()).toBeOk(uintWithDecimals(0));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(800));

    expect(core.getStxBalance(wallet_1)).toBeUint(uintWithDecimals(100000200).value);
  });

  it("reserve: request STX to stack and return STX from stacking", () => {
    const reserve = new Reserve(deployer);
    const core = new Core(deployer);

    // Add 1000 STX to reserve
    expect(core.deposit(deployer, 1000)).toBeOk(uintWithDecimals(1000));

    expect(reserve.getStxBalance()).toBeOk(uintWithDecimals(1000));

    expect(reserve.getStxStacking()).toBeOk(uintWithDecimals(0));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000));

    // Request 200 STX to stack
    expect(reserve.requestStxToStack(deployer, 200)).toBeOk(uintWithDecimals(200));

    expect(reserve.getStxBalance()).toBeOk(uintWithDecimals(800));

    expect(reserve.getStxStacking()).toBeOk(uintWithDecimals(200));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000));

    // Return 100 STX from stacking
    expect(reserve.returnStxFromStacking(deployer, 100)).toBeOk(uintWithDecimals(100));

    expect(reserve.getStxBalance()).toBeOk(uintWithDecimals(900));

    expect(reserve.getStxStacking()).toBeOk(uintWithDecimals(100));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000));

    simnet.mineEmptyBlocks(1);

    expect(reserve.getStxStackingAtBlock(8)).toBeOk(uintWithDecimals(0));

    expect(reserve.getStxStackingAtBlock(10)).toBeOk(uintWithDecimals(200));

    expect(reserve.getStxStackingAtBlock(11)).toBeOk(uintWithDecimals(100));
  });

  it("reserve: protocol can get STX", () => {
    const reserve = new Reserve(deployer);
    const core = new Core(deployer);

    // Add 1000 STX to reserve
    expect(core.deposit(deployer, 1000)).toBeOk(uintWithDecimals(1000));

    expect(reserve.getStxBalance()).toBeOk(uintWithDecimals(1000));

    expect(reserve.getStxStacking()).toBeOk(uintWithDecimals(0));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000));

    expect(core.getStxBalance(wallet_1)).toBeUint(uintWithDecimals(100000000).value);

    // Get 200 STX
    expect(reserve.getStx(deployer, 200, wallet_1)).toBeOk(uintWithDecimals(200));

    expect(core.getStxBalance(wallet_1)).toBeUint(uintWithDecimals(100000000 + 200).value);

    expect(reserve.getStxBalance()).toBeOk(uintWithDecimals(800));

    expect(reserve.getStxStacking()).toBeOk(uintWithDecimals(0));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(800));
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("reserve: can not get STX stacking at block in future", () => {
    const reserve = new Reserve(deployer);

    expect(reserve.getStxStackingAtBlock(600)).toBeErr(Cl.uint(17003));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("reserve: only protocol can lock and request STX for withdrawal", () => {
    const reserve = new Reserve(deployer);

    expect(reserve.lockStxForWithdrawal(wallet_1, 100)).toBeErr(Cl.uint(20003));

    expect(reserve.requestStxForWithdrawal(wallet_1, 100, wallet_1)).toBeErr(Cl.uint(20003));
  });

  it("reserve: only protocol can request STX to stack and return STX", () => {
    const reserve = new Reserve(deployer);

    expect(reserve.requestStxToStack(wallet_1, 100)).toBeErr(Cl.uint(20003));

    expect(reserve.returnStxFromStacking(wallet_1, 100)).toBeErr(Cl.uint(20003));
  });

  it("reserve: only protocol can get STX", () => {
    const reserve = new Reserve(deployer);

    expect(reserve.getStx(wallet_1, 100, wallet_1)).toBeErr(Cl.uint(20003));
  });
});
