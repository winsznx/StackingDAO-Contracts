import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import {
  mineEmptyBlockUntil,
  PREPARE_PHASE_LENGTH,
  qualifiedName,
  REWARD_CYCLE_LENGTH,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { CoreV1 as Core } from "../wrappers/stacking-dao-core-helpers";
import { DAO } from "../wrappers/dao-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;

//-------------------------------------
// Getters
//-------------------------------------

describe("core-v1", () => {
  it("core-v1: can get burn height", () => {
    const core = new Core(deployer);

    expect(core.getBurnHeight()).toBeUint(7);

    simnet.mineEmptyBlocks(500);

    expect(core.getBurnHeight()).toBeUint(507);
  });

  //-------------------------------------
  // Core
  //-------------------------------------

  it("core-v1: test STX to stSTX ratio", () => {
    const core = new Core(deployer);

    // Set commission to 0 so it does not influence STX per stSTX
    expect(core.setCommission(deployer, 0)).toBeOk(Cl.bool(true));

    // Deposit 1000 STX
    expect(core.deposit(deployer, 1000)).toBeOk(uintWithDecimals(1000));

    // Deposit 2000 STX
    expect(core.deposit(wallet_1, 2000)).toBeOk(uintWithDecimals(2000));

    // STX to stSTX ratio remains 1
    expect(core.getStxPerStstx()).toBeOk(uintWithDecimals(1));

    // Add 100 STX as rewards
    expect(core.addRewards(wallet_2, 100, 0)).toBeOk(uintWithDecimals(100));

    // STX to stSTX ratio increased
    // There are now 3100 STX in pool, for 3000 stSTX in supply
    // 3100/3000=1.0033333
    expect(core.getStxPerStstx()).toBeOk(uintWithDecimals(1.033333));

    // Deposit 1000 STX
    // 1000*1.0033333=967.742247
    expect(core.deposit(wallet_2, 1000)).toBeOk(uintWithDecimals(967.742247));

    // Deposit 2000 STX
    expect(core.deposit(wallet_3, 2000)).toBeOk(uintWithDecimals(1935.484495));

    // After deposits, STX to stSTX did not change
    expect(core.getStxPerStstx()).toBeOk(uintWithDecimals(1.033333));

    // Add 200 STX as rewards
    expect(core.addRewards(wallet_2, 200, 0)).toBeOk(uintWithDecimals(200));

    // There is now 6300 STX in pool, 5903 stSTX in supply
    // 6300/5903=1.067212
    expect(core.getStxPerStstx()).toBeOk(uintWithDecimals(1.067212));

    // Withdraw 250 stSTX tokens. Got NFT with ID 0.
    expect(core.initWithdraw(deployer, 250)).toBeOk(Cl.uint(0));

    // Advance to next cycle
    simnet.mineEmptyBlocks(500 + 2001);

    // 250 stSTX * 1.067212 = 266.803 STX
    expect(core.withdraw(deployer, 0)).toBeOk(uintWithDecimals(266.803));
  });

  it("core-v1: test deposit, STX to stSTX ratio and withdrawals", () => {
    const core = new Core(deployer);

    // Set commission to 0 so it does not influence STX per stSTX
    expect(core.setCommission(deployer, 0)).toBeOk(Cl.bool(true));

    // Deposit 1,000,000 STX
    expect(core.deposit(deployer, 1000000)).toBeOk(uintWithDecimals(1000000));

    // Got 1,000,000 stSTX
    expect(
      simnet.callReadOnlyFn("ststx-token", "get-balance", [Cl.principal(deployer)], wallet_1)
        .result,
    ).toBeOk(uintWithDecimals(1000000));

    // Advance to next cycle
    simnet.mineEmptyBlocks(REWARD_CYCLE_LENGTH + 1);

    // Add rewards
    expect(core.addRewards(wallet_2, 10000, 0)).toBeOk(uintWithDecimals(10000));

    // STX per stSTX ratio increased
    expect(core.getStxPerStstx()).toBeOk(uintWithDecimals(1.01));

    // Deposit 1M STX
    expect(core.deposit(wallet_1, 1000000)).toBeOk(uintWithDecimals(990099.0099));

    // Advance to next cycle
    simnet.mineEmptyBlocks(REWARD_CYCLE_LENGTH + 1);

    // Add rewards
    expect(core.addRewards(wallet_2, 18000, 1)).toBeOk(uintWithDecimals(18000));

    // Now let's see what the stSTX to STX ratio is
    expect(core.getStxPerStstx()).toBeOk(uintWithDecimals(1.019044));

    // Current PoX cycle
    expect(core.getPoxCycle()).toBeUint(2);

    // Let's test withdrawals
    // We are in cycle 2, so cycle 3 is the first we can withdraw (hence u5 as second param)
    expect(core.initWithdraw(deployer, 10000)).toBeOk(Cl.uint(0));

    // Deployer should have 10k stSTX less
    expect(
      simnet.callReadOnlyFn("ststx-token", "get-balance", [Cl.principal(deployer)], wallet_1)
        .result,
    ).toBeOk(uintWithDecimals(990000));

    // Deployer did not get STX back
    expect(core.getStxBalance(deployer)).toBeUint(uintWithDecimals(99000000).value); // 99M

    // Let's go 1 cycle further now
    simnet.mineEmptyBlocks(REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH);

    // Current PoX cycle
    expect(core.getPoxCycle()).toBeUint(3);

    // Withdraw
    expect(core.withdraw(deployer, 0)).toBeOk(uintWithDecimals(10190.44));

    // STX balance
    expect(core.getStxBalance(deployer)).toBeUint(uintWithDecimals(99010190.44).value);

    // After deployer pulled all their capital + rewards, the ratio remains the same
    expect(core.getStxPerStstx()).toBeOk(uintWithDecimals(1.019044));
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("core-v1: protocol can set commission", () => {
    const core = new Core(deployer);

    expect(core.getCommission()).toBeUint(500);

    expect(core.setCommission(deployer, 0.2)).toBeOk(Cl.bool(true));

    expect(core.getCommission()).toBeUint(0.2 * 10_000);

    expect(core.addRewards(deployer, 100, 0)).toBeOk(uintWithDecimals(100));

    // 100 STX added as rewards, 20% taken as commission
    // Commission contract keeps 100%
    // 100 * 0.2 = 20 STX
    expect(core.getStxBalance(qualifiedName("commission-v1"))).toBeUint(uintWithDecimals(20).value);
  });

  it("core-v1: protocol can shut down deposits", () => {
    const core = new Core(deployer);

    // Deposit 1,000,000 STX
    expect(core.deposit(deployer, 1000000)).toBeOk(uintWithDecimals(1000000));

    // Advance to next cycle
    simnet.mineEmptyBlocks(REWARD_CYCLE_LENGTH + 1);

    // Init withdraw
    expect(core.initWithdraw(deployer, 100)).toBeOk(Cl.uint(0));

    // Check shutdown
    expect(core.getShutdownDeposits()).toBeBool(false);

    // Shutdown deposits
    expect(core.setShutdownDeposits(deployer, true)).toBeOk(Cl.bool(true));

    // Can not deposit anymore
    expect(core.deposit(deployer, 1000000)).toBeErr(Cl.uint(19002));

    // Enable deposits
    expect(core.setShutdownDeposits(deployer, false)).toBeOk(Cl.bool(true));

    // Can not deposit again
    expect(core.deposit(deployer, 100)).toBeOk(uintWithDecimals(100));
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("core-v1: check if can withdraw", () => {
    const core = new Core(deployer);

    // PoX cycle 0
    expect(core.getPoxCycle()).toBeUint(0);

    // Advance to next cycle
    simnet.mineEmptyBlocks(REWARD_CYCLE_LENGTH);

    // PoX cycle 1
    expect(core.getPoxCycle()).toBeUint(1);

    // We are in cycle 1, so next cycle to withdraw in is 2
    expect(core.getNextWithdrawCycle()).toBeUint(2);

    // Deposit some STX
    expect(core.deposit(deployer, 10000)).toBeOk(uintWithDecimals(10000));

    // Initiate withdraw (for cycle 2)
    expect(core.initWithdraw(deployer, 10)).toBeOk(Cl.uint(0));

    // Can not withdraw as still in cycle 1
    expect(core.withdraw(deployer, 0)).toBeErr(Cl.uint(19001));

    // Advance to next cycle
    simnet.mineEmptyBlocks(REWARD_CYCLE_LENGTH);

    // PoX cycle 2
    expect(core.getPoxCycle()).toBeUint(2);

    // Can not withdraw as not owner of NFT
    expect(core.withdraw(wallet_1, 0)).toBeErr(Cl.uint(19004));

    // Can withdraw
    expect(core.withdraw(deployer, 0)).toBeOk(uintWithDecimals(10));

    // Can not withdraw again
    expect(core.withdraw(deployer, 0)).toBeErr(Cl.uint(19005));
  });

  it("core-v1: check init withdraw, taking into account prepare phase", () => {
    const core = new Core(deployer);

    // PoX cycle 0
    expect(core.getPoxCycle()).toBeUint(0);

    // Advance to next cycle
    mineEmptyBlockUntil(REWARD_CYCLE_LENGTH + 1);

    // PoX cycle 1
    expect(core.getPoxCycle()).toBeUint(1);

    // Advance to prepare phase of cycle 1. Target burn-height > (cycle-2-start - prepare-length)
    // = 42 - 3 = 39, so advance far enough that read-only calls observe burn 40.
    mineEmptyBlockUntil(2 * REWARD_CYCLE_LENGTH - PREPARE_PHASE_LENGTH + 2);

    // Still in cycle 1
    expect(core.getPoxCycle()).toBeUint(1);

    // In prepare phase, so can not withdraw in next cycle (2)
    // Need to withdraw in cycle after (3)
    expect(core.getNextWithdrawCycle()).toBeUint(3);

    // Deposit some STX
    expect(core.deposit(deployer, 10000)).toBeOk(uintWithDecimals(10000));

    // Init withdraw for cycle 3
    expect(core.initWithdraw(deployer, 10)).toBeOk(Cl.uint(0));

    // Can not withdraw as still in cycle 1
    expect(core.withdraw(deployer, 0)).toBeErr(Cl.uint(19001));

    // Advance to next cycle
    // simnet.mineEmptyBlocks(REWARD_CYCLE_LENGTH);

    // PoX cycle 2
    expect(core.getPoxCycle()).toBeUint(2);

    // Can not withdraw as cycle 3 not started
    expect(core.withdraw(deployer, 0)).toBeErr(Cl.uint(19001));

    // Advance to next cycle
    simnet.mineEmptyBlocks(REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH);

    // PoX cycle 3
    expect(core.getPoxCycle()).toBeUint(3);

    // Can withdraw
    expect(core.withdraw(deployer, 0)).toBeOk(uintWithDecimals(10));
  });

  it("core-v1: can not deposit, withdraw or add rewards if protocol not enabled", () => {
    const core = new Core(deployer);
    const dao = new DAO(deployer);

    expect(dao.setContractsEnabled(deployer, false)).toBeOk(Cl.bool(true));

    expect(core.deposit(deployer, 1000)).toBeErr(Cl.uint(20002));

    expect(core.addRewards(deployer, 100, 0)).toBeErr(Cl.uint(20002));

    expect(core.initWithdraw(deployer, 10)).toBeErr(Cl.uint(20002));

    expect(core.withdraw(deployer, 0)).toBeErr(Cl.uint(20002));
  });

  it("core-v1: can not set commission higher than max", () => {
    const core = new Core(deployer);

    expect(core.getCommission()).toBeUint(500);

    expect(core.setCommission(deployer, 0.21)).toBeErr(Cl.uint(19006));
  });

  it("core-v1: can not deposit with wrong reserve", () => {
    const { result } = simnet.callPublicFn(
      "stacking-dao-core-v1",
      "deposit",
      [
        Cl.principal(qualifiedName("fake-reserve")),
        Cl.uint(10 * 1_000_000),
        Cl.none(),
      ],
      deployer,
    );
    expect(result).toBeErr(Cl.uint(20003));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("core-v1: only protocol can use admin functions", () => {
    const core = new Core(deployer);

    expect(core.setCommission(wallet_1, 0.1)).toBeErr(Cl.uint(20003));

    expect(core.setShutdownDeposits(wallet_1, true)).toBeErr(Cl.uint(20003));
  });
});
