import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import {
  hexToBytes,
  qualifiedName,
  REWARD_CYCLE_LENGTH,
  someValue,
  tupleField,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { StrategyV0 as Strategy } from "../wrappers/strategy-helpers";
import { CoreV1 as Core } from "../wrappers/stacking-dao-core-helpers";
import { Reserve } from "../wrappers/reserve-helpers";
import { Stacker } from "../wrappers/stacker-helpers";
import { Pox3Mock } from "../wrappers/pox-mock-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Reward address
//-------------------------------------

describe("strategy-v0", () => {
  it("strategy-v0: get and set reward address", () => {
    const strategy = new Strategy(deployer);

    let addr = strategy.getPoxRewardAddress();
    expect(tupleField(addr, "version")).toBeBuff(hexToBytes("0x00"));
    expect(tupleField(addr, "hashbytes")).toBeBuff(hexToBytes("0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac"));

    expect(
      strategy.setPoxRewardAddress(deployer, hexToBytes("0x01"), hexToBytes("0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab")),
    ).toBeOk(Cl.bool(true));

    addr = strategy.getPoxRewardAddress();
    expect(tupleField(addr, "version")).toBeBuff(hexToBytes("0x01"));
    expect(tupleField(addr, "hashbytes")).toBeBuff(hexToBytes("0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab"));
  });

  //-------------------------------------
  // Get PoX info
  //-------------------------------------

  it("strategy-v0: get PoX info", () => {
    const strategy = new Strategy(deployer);

    expect(strategy.getPoxCycle()).toBeUint(0);

    expect(strategy.getNextCycleStartBurnHeight()).toBeUint(REWARD_CYCLE_LENGTH);
  });

  //-------------------------------------
  // Calculations - Get inflow/outflow
  //-------------------------------------

  it("strategy-v0: calculate inflow/outflow", () => {
    const strategy = new Strategy(deployer);
    const core = new Core(deployer);
    const reserve = new Reserve(deployer);
    const poxMock = new Pox3Mock(deployer);

    //
    // Deposit 300k STX
    //
    expect(core.deposit(deployer, 300000)).toBeOk(uintWithDecimals(300000));

    let io = strategy.getInflowOutflow();
    expect(tupleField(io, "inflow")).toBeUint(uintWithDecimals(300000).value);
    expect(tupleField(io, "outflow")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(io, "total-stacking")).toBeUint(uintWithDecimals(0).value);

    expect(
      strategy.performInflow(deployer, [50000, 50000, 50000, 50000, 50000, 50000, 0, 0, 0, 0]),
    ).toBeOk(Cl.bool(true));

    // Cycle info
    let cycleInfo = core.getCycleInfo(0);
    expect(tupleField(cycleInfo, "deposited")).toBeUint(uintWithDecimals(300000).value);
    expect(tupleField(cycleInfo, "withdraw-init")).toBeUint(uintWithDecimals(0).value);

    // Advance 1 cycle
    simnet.mineEmptyBurnBlocks(REWARD_CYCLE_LENGTH);

    expect(strategy.getPoxCycle()).toBeUint(1);

    //
    // Deposit 500k STX
    //
    expect(core.deposit(deployer, 500000)).toBeOk(uintWithDecimals(500000));

    io = strategy.getInflowOutflow();
    expect(tupleField(io, "inflow")).toBeUint(uintWithDecimals(500000).value);
    expect(tupleField(io, "outflow")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(io, "total-stacking")).toBeUint(uintWithDecimals(300000).value);
    expect(tupleField(io, "total-idle")).toBeUint(uintWithDecimals(500000).value);
    expect(tupleField(io, "total-withdrawals")).toBeUint(uintWithDecimals(0).value);

    expect(
      strategy.performInflow(deployer, [50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000]),
    ).toBeOk(Cl.bool(true));

    // Cycle info
    cycleInfo = core.getCycleInfo(1);
    expect(tupleField(cycleInfo, "deposited")).toBeUint(uintWithDecimals(500000).value);
    expect(tupleField(cycleInfo, "withdraw-init")).toBeUint(uintWithDecimals(0).value);

    // Advance 1 cycle
    simnet.mineEmptyBurnBlocks(REWARD_CYCLE_LENGTH);

    expect(strategy.getPoxCycle()).toBeUint(2);

    //
    // Deposit 10k STX, but 30k to be withdrawn
    // So net outflow of 20k STX
    //

    expect(core.deposit(deployer, 10000)).toBeOk(uintWithDecimals(10000));

    expect(core.initWithdraw(deployer, 30000)).toBeOk(Cl.uint(0));

    io = strategy.getInflowOutflow();
    expect(tupleField(io, "inflow")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(io, "outflow")).toBeUint(uintWithDecimals(20000).value);
    expect(tupleField(io, "total-stacking")).toBeUint(uintWithDecimals(800000).value);
    expect(tupleField(io, "total-idle")).toBeUint(uintWithDecimals(10000).value);
    expect(tupleField(io, "total-withdrawals")).toBeUint(uintWithDecimals(30000).value);

    expect(
      strategy.performOutflow(deployer, [true, false, false, false, false, false, false, false, false, false]),
    ).toBeOk(Cl.bool(true));

    // Cycle info
    cycleInfo = core.getCycleInfo(2);
    expect(tupleField(cycleInfo, "deposited")).toBeUint(uintWithDecimals(10000).value);
    expect(tupleField(cycleInfo, "withdraw-init")).toBeUint(uintWithDecimals(0).value);

    // Cycle info
    cycleInfo = core.getCycleInfo(3);
    expect(tupleField(cycleInfo, "deposited")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(cycleInfo, "withdraw-init")).toBeUint(uintWithDecimals(30000).value);

    // Advance 1 cycle
    simnet.mineEmptyBurnBlocks(REWARD_CYCLE_LENGTH);

    expect(strategy.getPoxCycle()).toBeUint(3);

    //
    // Return STX to reserve
    //

    // Need to unlock manually in tests
    // Stacked 50k initally + 50k second time = 100k total
    expect(poxMock.unlock(deployer, qualifiedName("stacker-1"))).toBeOk(uintWithDecimals(100000));

    // Return STX
    expect(strategy.stackersReturnStx(deployer)).toBeOk(Cl.bool(true));

    // 10k STX from deposit + 100k STX from stopping stacker 1
    expect(reserve.getStxBalance()).toBeOk(uintWithDecimals(110000));

    // Was stacking 800k STX but stopped stacker with 100k STX
    expect(reserve.getStxStacking()).toBeOk(uintWithDecimals(700000));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(810000));

    //
    // Deposit 30k STX, but 10k to be withdrawn
    // So net inflow of 20k STX
    //

    expect(core.deposit(deployer, 30000)).toBeOk(uintWithDecimals(30000));

    expect(core.initWithdraw(deployer, 10000)).toBeOk(Cl.uint(1));

    // 110k STX idle, of which 30k STX for withdrawals
    // Now there is a net inflow of 20k STX
    // So inflow should be: (110-30)+20 = 100
    io = strategy.getInflowOutflow();
    expect(tupleField(io, "inflow")).toBeUint(uintWithDecimals(100000).value);
    expect(tupleField(io, "outflow")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(io, "total-stacking")).toBeUint(uintWithDecimals(700000).value);
    // 100k from stopped stacker + 10k deposit + 30k deposit
    expect(tupleField(io, "total-idle")).toBeUint(uintWithDecimals(140000).value);
    // 30k + 10k
    expect(tupleField(io, "total-withdrawals")).toBeUint(uintWithDecimals(40000).value);

    // Perform inflow
    expect(
      strategy.performInflow(deployer, [50000, 0, 0, 0, 0, 0, 0, 0, 0, 50000]),
    ).toBeOk(Cl.bool(true));

    // Cycle info
    cycleInfo = core.getCycleInfo(3);
    expect(tupleField(cycleInfo, "deposited")).toBeUint(uintWithDecimals(30000).value);
    expect(tupleField(cycleInfo, "withdraw-init")).toBeUint(uintWithDecimals(30000).value);

    // Cycle info
    cycleInfo = core.getCycleInfo(4);
    expect(tupleField(cycleInfo, "deposited")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(cycleInfo, "withdraw-init")).toBeUint(uintWithDecimals(10000).value);

    // Advance 1 cycle
    simnet.mineEmptyBurnBlocks(REWARD_CYCLE_LENGTH);

    expect(strategy.getPoxCycle()).toBeUint(4);
  });

  //-------------------------------------
  // Perform - Inflow
  //-------------------------------------

  it("strategy-v0: perform inflow", () => {
    const strategy = new Strategy(deployer);
    const core = new Core(deployer);
    const stacker = new Stacker(deployer);

    expect(core.deposit(deployer, 300000)).toBeOk(uintWithDecimals(300000));

    expect(strategy.getLastCyclePerformed()).toBeUint(0);

    // Initiate stacking
    expect(
      strategy.performInflow(deployer, [50000, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    ).toBeOk(Cl.bool(true));

    // Last cycle performed increased
    expect(strategy.getLastCyclePerformed()).toBeUint(1);

    // Stacker info
    let stackerInfo = someValue(stacker.getStackerInfo(1));
    expect(tupleField(stackerInfo, "first-reward-cycle")).toBeUint(1);
    expect(tupleField(stackerInfo, "lock-period")).toBeUint(1);

    // Tokens are now locked
    let stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(50000).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(2 * REWARD_CYCLE_LENGTH);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(0).value);

    // Advance 1 cycle
    simnet.mineEmptyBurnBlocks(REWARD_CYCLE_LENGTH);

    expect(strategy.getPoxCycle()).toBeUint(1);

    // Increase stacking
    expect(
      strategy.performInflow(deployer, [10000, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    ).toBeOk(Cl.bool(true));

    // Last cycle performed increased
    expect(strategy.getLastCyclePerformed()).toBeUint(2);

    // Stacker info
    stackerInfo = someValue(stacker.getStackerInfo(1));
    expect(tupleField(stackerInfo, "first-reward-cycle")).toBeUint(1);
    expect(tupleField(stackerInfo, "lock-period")).toBeUint(2);

    // Tokens are now locked
    stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(60000).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(3 * REWARD_CYCLE_LENGTH);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(0).value);

    // Advance 1 cycle
    simnet.mineEmptyBurnBlocks(REWARD_CYCLE_LENGTH);

    expect(strategy.getPoxCycle()).toBeUint(2);

    // Extend stacking
    expect(
      strategy.performInflow(deployer, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    ).toBeOk(Cl.bool(true));

    // Last cycle performed increased
    expect(strategy.getLastCyclePerformed()).toBeUint(3);

    // Stacker info
    // When calling `stack-extend` the `first-reward-cycle` is updated to the current cycle
    stackerInfo = someValue(stacker.getStackerInfo(1));
    expect(tupleField(stackerInfo, "first-reward-cycle")).toBeUint(2);
    expect(tupleField(stackerInfo, "lock-period")).toBeUint(2);

    // Tokens are now locked
    stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(60000).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(4 * REWARD_CYCLE_LENGTH);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(0).value);
  });

  //-------------------------------------
  // Perform - Outflow
  //-------------------------------------

  it("strategy-v0: perform outflow", () => {
    const strategy = new Strategy(deployer);
    const core = new Core(deployer);
    const stacker = new Stacker(deployer);
    const poxMock = new Pox3Mock(deployer);

    expect(core.deposit(deployer, 300000)).toBeOk(uintWithDecimals(300000));

    expect(strategy.getLastCyclePerformed()).toBeUint(0);

    // Initiate stacking
    expect(
      strategy.performInflow(deployer, [50000, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    ).toBeOk(Cl.bool(true));

    // Last cycle performed increased
    expect(strategy.getLastCyclePerformed()).toBeUint(1);

    // Stacker info
    let stackerInfo = someValue(stacker.getStackerInfo(1));
    expect(tupleField(stackerInfo, "first-reward-cycle")).toBeUint(1);
    expect(tupleField(stackerInfo, "lock-period")).toBeUint(1);

    // Tokens are now locked
    let stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(50000).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(2 * REWARD_CYCLE_LENGTH);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(0).value);

    // Advance 1 cycle
    simnet.mineEmptyBurnBlocks(REWARD_CYCLE_LENGTH);

    expect(strategy.getPoxCycle()).toBeUint(1);

    // Perform outflow - do not stop stacker 1
    expect(
      strategy.performOutflow(deployer, [false, false, false, false, false, false, false, false, false, false]),
    ).toBeOk(Cl.bool(true));

    // Last cycle performed increased
    expect(strategy.getLastCyclePerformed()).toBeUint(2);

    // Stacker info
    stackerInfo = someValue(stacker.getStackerInfo(1));
    expect(tupleField(stackerInfo, "first-reward-cycle")).toBeUint(1);
    expect(tupleField(stackerInfo, "lock-period")).toBeUint(2);

    // Tokens are now locked
    stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(50000).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(3 * REWARD_CYCLE_LENGTH);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(0).value);

    // Advance 1 cycle
    simnet.mineEmptyBurnBlocks(REWARD_CYCLE_LENGTH);

    expect(strategy.getPoxCycle()).toBeUint(2);

    // Perform outflow - stop stacker 1
    expect(
      strategy.performOutflow(deployer, [true, false, false, false, false, false, false, false, false, false]),
    ).toBeOk(Cl.bool(true));

    // Last cycle performed increased
    expect(strategy.getLastCyclePerformed()).toBeUint(3);

    // Advance to unlock height
    simnet.mineEmptyBurnBlocks(3 * REWARD_CYCLE_LENGTH);

    // Need to unlock manually in tests
    // Stacked 50k initally + 50k second time = 100k total
    expect(poxMock.unlock(deployer, qualifiedName("stacker-1"))).toBeOk(uintWithDecimals(50000));

    // Return STX
    expect(strategy.stackersReturnStx(deployer)).toBeOk(Cl.bool(true));

    // Stacker info
    expect(stacker.getStackerInfo(1)).toBeNone();

    // Tokens are now locked
    stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(0);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(0).value);
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("strategy-v0: only protocol can perform inflow/outflow", () => {
    const strategy = new Strategy(deployer);

    expect(
      strategy.performInflow(wallet_1, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    ).toBeErr(Cl.uint(20003));

    expect(
      strategy.performOutflow(wallet_1, [true, false, false, false, false, false, false, false, false, false]),
    ).toBeErr(Cl.uint(20003));
  });
});
