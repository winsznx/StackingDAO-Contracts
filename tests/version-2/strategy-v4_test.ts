import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import {
  mineEmptyBlockUntil,
  qualifiedName,
  REWARD_CYCLE_LENGTH,
  someValue,
  tupleField,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { StrategyV4 } from "../wrappers/strategy-helpers";
import { Reserve } from "../wrappers/reserve-helpers";
import { StackingPool } from "../wrappers/stacking-pool-helpers";
import { Pox4Mock } from "../wrappers/pox-mock-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Strategy V2
//-------------------------------------

describe("strategy-v4", () => {
  it("strategy-v4: calculate outflow/inflow", () => {
    const strategy = new StrategyV4(deployer);
    const stackingPool = new StackingPool(deployer);
    const reserve = new Reserve(deployer);
    stackingPool.addSignatures(deployer);

    // 150k STX to reserve
    expect(simnet.transferSTX(150000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    //
    // Inflow
    //
    let io = strategy.getInflowOutflow();
    expect(tupleField(io, "outflow")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(io, "inflow")).toBeUint(uintWithDecimals(150000).value);
    expect(tupleField(io, "total-stacking")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(io, "total-idle")).toBeUint(uintWithDecimals(150000).value);
    expect(tupleField(io, "total-withdrawals")).toBeUint(uintWithDecimals(0).value);

    //
    // Stack
    //
    expect(
      strategy.performPoolDelegation(deployer, qualifiedName("stacking-pool-v1"), [
        { delegate: qualifiedName("stacking-delegate-1-1"), amount: 100000 },
        { delegate: qualifiedName("stacking-delegate-1-2"), amount: 30000 },
        { delegate: qualifiedName("stacking-delegate-1-3"), amount: 20000 },
      ]),
    ).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(REWARD_CYCLE_LENGTH - 3);

    expect(stackingPool.prepare(deployer)).toBeOk(Cl.bool(true));

    //
    // Outflow
    //
    reserve.lockStxForWithdrawal(deployer, 20000);

    io = strategy.getInflowOutflow();
    expect(tupleField(io, "outflow")).toBeUint(uintWithDecimals(20000).value);
    expect(tupleField(io, "inflow")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(io, "total-stacking")).toBeUint(uintWithDecimals(150000).value);
    expect(tupleField(io, "total-idle")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(io, "total-withdrawals")).toBeUint(uintWithDecimals(20000).value);
  });

  it("strategy-v4: perform delegation", () => {
    const strategy = new StrategyV4(deployer);
    const pox = new Pox4Mock(deployer);
    const stackingPool = new StackingPool(deployer);
    stackingPool.addSignatures(deployer);

    // 300k STX to reserve
    expect(simnet.transferSTX(300000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    //
    // Perform delegation
    //
    expect(
      strategy.performPoolDelegation(deployer, qualifiedName("stacking-pool-v1"), [
        { delegate: qualifiedName("stacking-delegate-1-1"), amount: 100000 },
        { delegate: qualifiedName("stacking-delegate-1-2"), amount: 30000 },
        { delegate: qualifiedName("stacking-delegate-1-3"), amount: 20000 },
      ]),
    ).toBeOk(Cl.bool(true));

    let delegation = someValue(pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1")));
    expect(tupleField(delegation, "amount-ustx")).toBeUint(uintWithDecimals(100000).value);
    expect(tupleField(delegation, "delegated-to")).toBePrincipal(qualifiedName("stacking-pool-v1"));
    expect(someValue(tupleField(delegation, "until-burn-ht"))).toBeUint(REWARD_CYCLE_LENGTH * 2);

    let account = stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(100000).value);
    expect(tupleField(account, "unlock-height")).toBeUint(0);

    //
    // Prepare pool
    //
    mineEmptyBlockUntil(REWARD_CYCLE_LENGTH - 3);

    expect(stackingPool.prepare(deployer)).toBeOk(Cl.bool(true));

    account = stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(100000).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(account, "unlock-height")).toBeUint(REWARD_CYCLE_LENGTH * 2);

    //
    // Perform delegation
    //
    mineEmptyBlockUntil(REWARD_CYCLE_LENGTH + 3);

    // Inflow, outflow and same
    expect(
      strategy.performPoolDelegation(deployer, qualifiedName("stacking-pool-v1"), [
        { delegate: qualifiedName("stacking-delegate-1-1"), amount: 130000 },
        { delegate: qualifiedName("stacking-delegate-1-2"), amount: 0 },
        { delegate: qualifiedName("stacking-delegate-1-3"), amount: 20000 },
      ]),
    ).toBeOk(Cl.bool(true));

    delegation = someValue(pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1")));
    expect(tupleField(delegation, "amount-ustx")).toBeUint(uintWithDecimals(130000).value);
    expect(tupleField(delegation, "delegated-to")).toBePrincipal(qualifiedName("stacking-pool-v1"));
    expect(someValue(tupleField(delegation, "until-burn-ht"))).toBeUint(REWARD_CYCLE_LENGTH * 3);

    expect(pox.getCheckDelegation(qualifiedName("stacking-delegate-1-2"))).toBeNone();

    delegation = someValue(pox.getCheckDelegation(qualifiedName("stacking-delegate-1-3")));
    expect(tupleField(delegation, "amount-ustx")).toBeUint(uintWithDecimals(20000).value);
    expect(tupleField(delegation, "delegated-to")).toBePrincipal(qualifiedName("stacking-pool-v1"));
    expect(someValue(tupleField(delegation, "until-burn-ht"))).toBeUint(REWARD_CYCLE_LENGTH * 3);

    //
    // Prepare pool
    //
    mineEmptyBlockUntil(REWARD_CYCLE_LENGTH * 2 - 3);

    expect(stackingPool.prepare(deployer)).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(REWARD_CYCLE_LENGTH * 2 + 3);

    // Manually unlock
    pox.unlock(deployer, qualifiedName("stacking-delegate-1-2"));

    account = stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(130000).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(account, "unlock-height")).toBeUint(REWARD_CYCLE_LENGTH * 3);

    account = stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-2"));
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(30000).value);
    expect(tupleField(account, "unlock-height")).toBeUint(0);

    account = stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-3"));
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(20000).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(account, "unlock-height")).toBeUint(REWARD_CYCLE_LENGTH * 3);
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("strategy-v4: only manager can perform delegations", () => {
    const strategy = new StrategyV4(deployer);
    const stackingPool = new StackingPool(deployer);
    stackingPool.addSignatures(deployer);

    // 300k STX to reserve
    expect(simnet.transferSTX(300000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    // Not manager
    expect(
      strategy.performPoolDelegation(wallet_1, qualifiedName("stacking-pool-v1"), [
        { delegate: qualifiedName("stacking-delegate-1-1"), amount: 100000 },
      ]),
    ).toBeErr(Cl.uint(40001));

    expect(strategy.getManager()).toBePrincipal(deployer);

    // Update manager
    expect(strategy.setManager(deployer, wallet_1)).toBeOk(Cl.bool(true));

    expect(strategy.getManager()).toBePrincipal(wallet_1);

    // New manager
    expect(
      strategy.performPoolDelegation(wallet_1, qualifiedName("stacking-pool-v1"), [
        { delegate: qualifiedName("stacking-delegate-1-1"), amount: 100000 },
      ]),
    ).toBeOk(Cl.bool(true));

    // Old manager
    expect(
      strategy.performPoolDelegation(deployer, qualifiedName("stacking-pool-v1"), [
        { delegate: qualifiedName("stacking-delegate-1-1"), amount: 100000 },
      ]),
    ).toBeErr(Cl.uint(40001));
  });
});
