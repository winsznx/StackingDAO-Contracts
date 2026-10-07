import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import {
  mineEmptyBlockUntil,
  okValue,
  qualifiedName,
  someValue,
  tupleField,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { Core, CoreV1 } from "../wrappers/stacking-dao-core-helpers";
import { DataCore, DataCoreV2 } from "../wrappers/data-core-helpers";
import { DataDirectStacking } from "../wrappers/data-direct-stacking-helpers";
import { Reserve } from "../wrappers/reserve-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Ratio
//-------------------------------------

describe("stacking-dao-core", () => {
  it("core: ratio changes while withdrawing", () => {
    const core = new Core(deployer);
    const dataCore = new DataCore(deployer);
    const reserve = new Reserve(deployer);

    // Make deposit
    expect(core.deposit(wallet_1, 1000, undefined, undefined)).toBeOk(uintWithDecimals(1000));

    // Add STX to reserve (simulate rewards)
    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000));

    // Check initial ratio
    expect(dataCore.getStxPerStStx(qualifiedName("reserve-v1"))).toBeOk(uintWithDecimals(1));

    // Add more STX to reserve to change the ratio (simulate rewards)
    expect(simnet.transferSTX(500 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1500));

    // Check ratio after adding STX
    expect(dataCore.getStxPerStStx(qualifiedName("reserve-v1"))).toBeOk(uintWithDecimals(1.5));

    // Init withdraw
    expect(core.initWithdraw(wallet_1, 200)).toBeOk(Cl.uint(100000));

    // Check ratio during withdrawal (should remain the same as withdrawal is locked)
    expect(dataCore.getStxPerStStx(qualifiedName("reserve-v1"))).toBeOk(uintWithDecimals(1.5));

    // Wait for withdrawal to be available
    mineEmptyBlockUntil(21 * 2 + 2 + 3);

    // Withdraw
    let result = okValue(core.withdraw(wallet_1, 100000));
    expect(tupleField(result, "stx-user-amount")).toBeUint(uintWithDecimals(300).value); // 200 * 1.5 ratio

    // Check ratio after withdrawal (should remain the same)
    expect(dataCore.getStxPerStStx(qualifiedName("reserve-v1"))).toBeOk(uintWithDecimals(1.5));

    // Verify total STX decreased
    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1200)); // 1500 - 300
  });

  //-------------------------------------
  // Core
  //-------------------------------------

  it("core: deposit and withdraw for normal stacking", () => {
    const core = new Core(deployer);
    const dataCore = new DataCore(deployer);
    const reserve = new Reserve(deployer);

    expect(core.deposit(wallet_1, 1000, undefined, undefined)).toBeOk(uintWithDecimals(1000));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000));
    expect(reserve.getStxForWithdrawals()).toBeOk(uintWithDecimals(0));

    expect(core.getWithdrawUnlockBurnHeight()).toBeOk(Cl.uint(24));

    expect(core.initWithdraw(wallet_1, 200)).toBeOk(Cl.uint(100000));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000));
    expect(reserve.getStxForWithdrawals()).toBeOk(uintWithDecimals(200));

    let withdrawal = dataCore.getWithdrawalsByNft(100000);
    expect(tupleField(withdrawal, "ststx-amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(withdrawal, "stx-amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(withdrawal, "unlock-burn-height")).toBeUint(24);

    mineEmptyBlockUntil(21 + 2 + 3);

    let result = okValue(core.withdraw(wallet_1, 100000));
    expect(tupleField(result, "stx-user-amount")).toBeUint(uintWithDecimals(200).value);

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(800));
    expect(reserve.getStxForWithdrawals()).toBeOk(uintWithDecimals(0));
  });

  it("core: deposit and withdraw for direct stacking", () => {
    const core = new Core(deployer);
    const dataCore = new DataCore(deployer);
    const dataDirectStacking = new DataDirectStacking(deployer);
    const reserve = new Reserve(deployer);

    expect(core.deposit(wallet_1, 1000, undefined, qualifiedName("stacking-pool-v1"))).toBeOk(uintWithDecimals(1000));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000));
    expect(reserve.getStxForWithdrawals()).toBeOk(uintWithDecimals(0));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(1000).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(1000).value);
    let user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(1000).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("stacking-pool-v1"));

    expect(core.getWithdrawUnlockBurnHeight()).toBeOk(Cl.uint(24));

    expect(core.initWithdraw(wallet_1, 200)).toBeOk(Cl.uint(100000));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000));
    expect(reserve.getStxForWithdrawals()).toBeOk(uintWithDecimals(200));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(800).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(800).value);
    user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(800).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("stacking-pool-v1"));

    let withdrawal = dataCore.getWithdrawalsByNft(100000);
    expect(tupleField(withdrawal, "ststx-amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(withdrawal, "stx-amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(withdrawal, "unlock-burn-height")).toBeUint(24);

    mineEmptyBlockUntil(21 + 2 + 3);

    let result = okValue(core.withdraw(wallet_1, 100000));
    expect(tupleField(result, "stx-user-amount")).toBeUint(uintWithDecimals(200).value);

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(800));
    expect(reserve.getStxForWithdrawals()).toBeOk(uintWithDecimals(0));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(800).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(800).value);
    user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(800).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("stacking-pool-v1"));
  });

  it("core: withdraw at end of cycle", () => {
    const core = new Core(deployer);
    const dataCore = new DataCore(deployer);

    expect(core.deposit(wallet_1, 1000, undefined, undefined)).toBeOk(uintWithDecimals(1000));

    mineEmptyBlockUntil(19);

    expect(core.getWithdrawUnlockBurnHeight()).toBeOk(Cl.uint(21 * 2 + 3));

    expect(core.initWithdraw(wallet_1, 200)).toBeOk(Cl.uint(100000));

    let withdrawal = dataCore.getWithdrawalsByNft(100000);
    expect(tupleField(withdrawal, "ststx-amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(withdrawal, "stx-amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(withdrawal, "unlock-burn-height")).toBeUint(45);

    mineEmptyBlockUntil(21 * 2 + 2 + 3);

    let result = okValue(core.withdraw(wallet_1, 100000));
    expect(tupleField(result, "stx-user-amount")).toBeUint(uintWithDecimals(200).value);
  });

  it("core: stack/unstack fee", () => {
    const core = new Core(deployer);
    const coreV1 = new CoreV1(deployer);
    const dataCore = new DataCore(deployer);

    expect(core.setStackFee(deployer, 500)).toBeOk(Cl.bool(true));
    expect(core.setUnstackFee(deployer, 500)).toBeOk(Cl.bool(true));

    // 1000 minus 5% fee
    expect(core.deposit(wallet_1, 1000, undefined, undefined)).toBeOk(uintWithDecimals(950));

    expect(coreV1.getStxBalance(qualifiedName("commission-v2"))).toBeUint(uintWithDecimals(50).value);

    mineEmptyBlockUntil(19);

    expect(core.getWithdrawUnlockBurnHeight()).toBeOk(Cl.uint(21 * 2 + 3));

    expect(core.initWithdraw(wallet_1, 200)).toBeOk(Cl.uint(100000));

    let withdrawal = dataCore.getWithdrawalsByNft(100000);
    expect(tupleField(withdrawal, "ststx-amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(withdrawal, "stx-amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(withdrawal, "unlock-burn-height")).toBeUint(45);

    mineEmptyBlockUntil(21 * 2 + 2 + 3);

    let result = okValue(core.withdraw(wallet_1, 100000));
    expect(tupleField(result, "stx-user-amount")).toBeUint(uintWithDecimals(190).value);
    expect(tupleField(result, "stx-fee-amount")).toBeUint(uintWithDecimals(10).value);

    // 200 * 5% = 10
    // Already had 50 from deposit
    expect(coreV1.getStxBalance(qualifiedName("commission-v2"))).toBeUint(uintWithDecimals(50 + 10).value);
  });

  it("core: withdraw idle stx with fee", () => {
    const core = new Core(deployer);
    const coreV1 = new CoreV1(deployer);
    const dataCore = new DataCoreV2(deployer);
    const reserve = new Reserve(deployer);

    expect(core.setWithdrawIdleFee(deployer, 500)).toBeOk(Cl.bool(true));

    expect(core.deposit(deployer, 1000, undefined, undefined)).toBeOk(uintWithDecimals(1000));

    expect(core.getIdleCycle()).toBeOk(Cl.uint(0));

    expect(dataCore.getStxIdle(0)).toBeUint(uintWithDecimals(1000).value);

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000));

    mineEmptyBlockUntil(23);

    expect(core.deposit(wallet_1, 200, undefined, undefined)).toBeOk(uintWithDecimals(200));

    expect(core.getIdleCycle()).toBeOk(Cl.uint(1));

    expect(dataCore.getStxIdle(1)).toBeUint(uintWithDecimals(200).value);

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000 + 200));

    let result = okValue(core.withdrawIdle(deployer, 200));
    expect(tupleField(result, "stx-user-amount")).toBeUint(uintWithDecimals(190).value);
    expect(tupleField(result, "stx-fee-amount")).toBeUint(uintWithDecimals(10).value);

    expect(dataCore.getStxIdle(1)).toBeUint(uintWithDecimals(0).value);

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(1000));

    expect(coreV1.getStxBalance(qualifiedName("commission-v2"))).toBeUint(uintWithDecimals(10).value);
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("core: admin can shutdown deposits", () => {
    const core = new Core(deployer);

    expect(core.deposit(wallet_1, 1000, undefined, qualifiedName("stacking-pool-v1"))).toBeOk(uintWithDecimals(1000));

    expect(core.getShutdownDeposits()).toBeBool(false);

    expect(core.setShutdownDeposits(deployer, true)).toBeOk(Cl.bool(true));

    expect(core.getShutdownDeposits()).toBeBool(true);

    expect(core.deposit(wallet_1, 1000, undefined, qualifiedName("stacking-pool-v1"))).toBeErr(Cl.uint(204002));

    expect(core.setShutdownDeposits(deployer, false)).toBeOk(Cl.bool(true));

    expect(core.getShutdownDeposits()).toBeBool(false);

    expect(core.deposit(wallet_1, 1000, undefined, qualifiedName("stacking-pool-v1"))).toBeOk(uintWithDecimals(1000));
  });

  it("core: admin can shutdown withdraw idle", () => {
    const core = new Core(deployer);

    mineEmptyBlockUntil(19);

    expect(core.deposit(wallet_1, 1000, undefined, qualifiedName("stacking-pool-v1"))).toBeOk(uintWithDecimals(1000));

    expect(core.getShutdownWithdrawIdle()).toBeBool(false);

    expect(core.setShutdownWithdrawIdle(deployer, true)).toBeOk(Cl.bool(true));

    expect(core.getShutdownWithdrawIdle()).toBeBool(true);

    expect(core.withdrawIdle(wallet_1, 10)).toBeErr(Cl.uint(204002));

    expect(core.setShutdownWithdrawIdle(deployer, false)).toBeOk(Cl.bool(true));

    expect(core.getShutdownWithdrawIdle()).toBeBool(false);

    let result = okValue(core.withdrawIdle(wallet_1, 10));
    expect(tupleField(result, "stx-user-amount")).toBeUint(uintWithDecimals(9.9).value);
  });

  it("core: admin can shutdown init withdraws", () => {
    const core = new Core(deployer);

    expect(core.deposit(wallet_1, 1000, undefined, qualifiedName("stacking-pool-v1"))).toBeOk(uintWithDecimals(1000));

    expect(core.getShutdownInitWithdraw()).toBeBool(false);

    expect(core.setShutdownInitWithdraw(deployer, true)).toBeOk(Cl.bool(true));

    expect(core.getShutdownInitWithdraw()).toBeBool(true);

    expect(core.initWithdraw(wallet_1, 1000)).toBeErr(Cl.uint(204002));

    expect(core.setShutdownInitWithdraw(deployer, false)).toBeOk(Cl.bool(true));

    expect(core.getShutdownInitWithdraw()).toBeBool(false);

    expect(core.initWithdraw(wallet_1, 1000)).toBeOk(Cl.uint(100000));
  });

  it("core: admin can shutdown withdraws", () => {
    const core = new Core(deployer);

    expect(core.deposit(wallet_1, 1000, undefined, qualifiedName("stacking-pool-v1"))).toBeOk(uintWithDecimals(1000));

    expect(core.initWithdraw(wallet_1, 1000)).toBeOk(Cl.uint(100000));

    mineEmptyBlockUntil(21 + 4);

    expect(core.getShutdownWithdraw()).toBeBool(false);

    expect(core.setShutdownWithdraw(deployer, true)).toBeOk(Cl.bool(true));

    expect(core.getShutdownWithdraw()).toBeBool(true);

    expect(core.withdraw(wallet_1, 100000)).toBeErr(Cl.uint(204002));

    expect(core.setShutdownWithdraw(deployer, false)).toBeOk(Cl.bool(true));

    expect(core.getShutdownWithdraw()).toBeBool(false);

    let result = okValue(core.withdraw(wallet_1, 100000));
    expect(tupleField(result, "stx-user-amount")).toBeUint(uintWithDecimals(1000).value);
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("core: only protocol can call admin methods", () => {
    const core = new Core(deployer);

    expect(core.setShutdownDeposits(wallet_1, true)).toBeErr(Cl.uint(20003));

    expect(core.setShutdownInitWithdraw(wallet_1, true)).toBeErr(Cl.uint(20003));

    expect(core.setShutdownWithdraw(wallet_1, true)).toBeErr(Cl.uint(20003));

    expect(core.setShutdownWithdrawIdle(wallet_1, true)).toBeErr(Cl.uint(20003));

    expect(core.setStackFee(wallet_1, 100)).toBeErr(Cl.uint(20003));

    expect(core.setUnstackFee(wallet_1, 100)).toBeErr(Cl.uint(20003));

    expect(core.setWithdrawIdleFee(wallet_1, 100)).toBeErr(Cl.uint(20003));
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("core: can not call deposit with wrong trait params", () => {
    let r = simnet.callPublicFn(
      "stacking-dao-core-v6",
      "deposit",
      [
        Cl.principal(qualifiedName("fake-reserve")),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.principal(qualifiedName("direct-helpers-v4")),
        Cl.uint(100 * 1_000_000),
        Cl.none(),
        Cl.none(),
      ],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(20003));

    r = simnet.callPublicFn(
      "stacking-dao-core-v6",
      "deposit",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.principal(qualifiedName("fake-direct-helpers")),
        Cl.uint(100 * 1_000_000),
        Cl.none(),
        Cl.none(),
      ],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(20003));
  });

  it("core: can not call withdraw idle with wrong trait params", () => {
    let r = simnet.callPublicFn(
      "stacking-dao-core-v6",
      "withdraw-idle",
      [
        Cl.principal(qualifiedName("fake-reserve")),
        Cl.principal(qualifiedName("direct-helpers-v4")),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.uint(100 * 1_000_000),
      ],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(20003));

    r = simnet.callPublicFn(
      "stacking-dao-core-v6",
      "withdraw-idle",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("fake-direct-helpers")),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.uint(100 * 1_000_000),
      ],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(20003));
  });

  it("core: can not call init-withdraw with wrong trait params", () => {
    let r = simnet.callPublicFn(
      "stacking-dao-core-v6",
      "init-withdraw",
      [
        Cl.principal(qualifiedName("fake-reserve")),
        Cl.principal(qualifiedName("direct-helpers-v4")),
        Cl.uint(100 * 1_000_000),
      ],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(20003));

    r = simnet.callPublicFn(
      "stacking-dao-core-v6",
      "init-withdraw",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("fake-direct-helpers")),
        Cl.uint(100 * 1_000_000),
      ],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(20003));
  });

  it("core: can not call withdraw with wrong trait params", () => {
    let r = simnet.callPublicFn(
      "stacking-dao-core-v6",
      "withdraw",
      [
        Cl.principal(qualifiedName("fake-reserve")),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.uint(0),
      ],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(20003));
  });

  it("core: can only withdraw idle if enough deposited", () => {
    const core = new Core(deployer);

    expect(core.deposit(wallet_1, 1000, undefined, undefined)).toBeOk(uintWithDecimals(1000));

    expect(core.withdrawIdle(wallet_1, 1000 + 1)).toBeErr(Cl.uint(204006));
  });

  it("core: can only withdraw if burn block height reached", () => {
    const core = new Core(deployer);

    expect(core.deposit(wallet_1, 1000, undefined, undefined)).toBeOk(uintWithDecimals(1000));

    expect(core.initWithdraw(wallet_1, 200)).toBeOk(Cl.uint(100000));

    mineEmptyBlockUntil(21);

    expect(core.withdraw(wallet_1, 100000)).toBeErr(Cl.uint(204001));

    mineEmptyBlockUntil(21 + 4);

    let result = okValue(core.withdraw(wallet_1, 100000));
    expect(tupleField(result, "stx-user-amount")).toBeUint(uintWithDecimals(200).value);
  });

  it("core: only withdrawal NFT owner can withdraw", () => {
    const core = new Core(deployer);

    expect(core.deposit(deployer, 1000, undefined, undefined)).toBeOk(uintWithDecimals(1000));

    expect(core.deposit(wallet_1, 1000, undefined, undefined)).toBeOk(uintWithDecimals(1000));

    expect(core.initWithdraw(deployer, 200)).toBeOk(Cl.uint(100000));

    expect(core.initWithdraw(wallet_1, 200)).toBeOk(Cl.uint(100000 + 1));

    mineEmptyBlockUntil(21 + 4);

    expect(core.withdraw(wallet_1, 100000)).toBeErr(Cl.uint(204003));

    let result = okValue(core.withdraw(deployer, 100000));
    expect(tupleField(result, "stx-user-amount")).toBeUint(uintWithDecimals(200).value);
  });

  it("core: can only use existing NFT to withdraw", () => {
    const core = new Core(deployer);

    expect(core.deposit(deployer, 1000, undefined, undefined)).toBeOk(uintWithDecimals(1000));

    expect(core.deposit(wallet_1, 1000, undefined, undefined)).toBeOk(uintWithDecimals(1000));

    expect(core.initWithdraw(deployer, 200)).toBeOk(Cl.uint(100000));

    expect(core.initWithdraw(wallet_1, 200)).toBeOk(Cl.uint(100000 + 1));

    // Advance past the NFT 1 unlock-burn-height (post-Nakamoto simnet starts at burn ~7,
    // so the second init-withdraw can spill into cycle 2 -> unlock at 45)
    mineEmptyBlockUntil(21 * 2 + 2 + 3);

    let result = okValue(core.withdraw(wallet_1, 100000 + 1));
    expect(tupleField(result, "stx-user-amount")).toBeUint(uintWithDecimals(200).value);

    expect(core.withdraw(wallet_1, 100000 + 1)).toBeErr(Cl.uint(204004));

    expect(core.withdraw(wallet_1, 100000 + 99)).toBeErr(Cl.uint(204004));
  });

  it("core: can not set fee higher than 10000 BPS", () => {
    const core = new Core(deployer);

    expect(core.setStackFee(deployer, 10001)).toBeErr(Cl.uint(204007));

    expect(core.setUnstackFee(deployer, 10001)).toBeErr(Cl.uint(204007));

    expect(core.setWithdrawIdleFee(deployer, 10001)).toBeErr(Cl.uint(204007));
  });
});
