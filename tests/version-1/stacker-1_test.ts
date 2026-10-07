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
import { DAO } from "../wrappers/dao-helpers";
import { Reserve } from "../wrappers/reserve-helpers";
import { CoreV1 as Core } from "../wrappers/stacking-dao-core-helpers";
import { Stacker } from "../wrappers/stacker-helpers";
import { Pox3Mock } from "../wrappers/pox-mock-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

const FAKE_POX_ADDR = Cl.tuple({
  version: Cl.buffer(new Uint8Array([0x00])),
  hashbytes: Cl.buffer(hexToBytes("f632e6f9d29bfb07bc8948ca6e0dd09358f003ac")),
});

//-------------------------------------
// Core
//-------------------------------------

describe("stacker", () => {
  it("stacker: can initiate stacking, increase and extend", () => {
    const core = new Core(deployer);
    const stacker = new Stacker(deployer);

    // Check PoX info
    let poxInfo = stacker.getPoxInfo(1);
    expect(tupleField(poxInfo, "reward-cycle-id")).toBeUint(0);
    expect(tupleField(poxInfo, "reward-cycle-length")).toBeUint(REWARD_CYCLE_LENGTH);
    expect(tupleField(poxInfo, "min-amount-ustx")).toBeUint(uintWithDecimals(50000).value);

    // Deposit 150k STX to reserve
    expect(core.deposit(deployer, 150000)).toBeOk(uintWithDecimals(150000));

    expect(stacker.getStxBalance(1)).toBeUint(uintWithDecimals(0).value);

    // No stacker info yet
    expect(stacker.getStackerInfo(1)).toBeNone();

    // Nothing locked yet. Unlocked 0 as stacker does not have any tokens.
    let stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(0);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(0).value);

    // In cycle 0
    poxInfo = stacker.getPoxInfo(1);
    expect(tupleField(poxInfo, "reward-cycle-id")).toBeUint(uintWithDecimals(0).value);

    //
    // Start stacking
    //
    expect(stacker.initiateStacking(1, deployer, 125000, 0, 1)).toBeOk(uintWithDecimals(125000));

    // Check if burn height updated
    expect(stacker.getStackingUnlockBurnHeight(1)).toBeUint(2 * REWARD_CYCLE_LENGTH);

    // Check if STX stacked updated
    expect(stacker.getStxStacked(1)).toBeUint(uintWithDecimals(125000).value);

    expect(stacker.getStackingStxStacked(1)).toBeUint(uintWithDecimals(125000).value);

    // Stacker info
    let stackerInfo = someValue(stacker.getStackerInfo(1));
    expect(tupleField(stackerInfo, "first-reward-cycle")).toBeUint(1);
    expect(tupleField(stackerInfo, "lock-period")).toBeUint(1);

    // Tokens are now locked
    stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(125000).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(2 * REWARD_CYCLE_LENGTH);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(0).value);

    //
    // Extend with 1 cycle
    //
    expect(stacker.stackExtend(1, deployer, 1)).toBeOk(Cl.uint(1));

    // Check if burn height updated
    expect(stacker.getStackingUnlockBurnHeight(1)).toBeUint(3 * REWARD_CYCLE_LENGTH);

    // Check if STX stacked updated
    expect(stacker.getStxStacked(1)).toBeUint(uintWithDecimals(125000).value);

    // Stacker info
    stackerInfo = someValue(stacker.getStackerInfo(1));
    expect(tupleField(stackerInfo, "first-reward-cycle")).toBeUint(1);
    expect(tupleField(stackerInfo, "lock-period")).toBeUint(2);

    // Tokens are now locked for extra <REWARD_CYCLE_LENGTH> blocks
    stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(125000).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(3 * REWARD_CYCLE_LENGTH);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(0).value);

    //
    // Increase with 5k STX
    //
    expect(stacker.stackIncrease(1, deployer, 5000)).toBeOk(uintWithDecimals(5000));

    // Check if burn height updated
    expect(stacker.getStackingUnlockBurnHeight(1)).toBeUint(3 * REWARD_CYCLE_LENGTH);

    // Check if STX stacked updated
    expect(stacker.getStxStacked(1)).toBeUint(uintWithDecimals(130000).value);

    // Stacker info
    stackerInfo = someValue(stacker.getStackerInfo(1));
    expect(tupleField(stackerInfo, "first-reward-cycle")).toBeUint(1);
    expect(tupleField(stackerInfo, "lock-period")).toBeUint(2);

    // Locked increased
    stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(130000).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(3 * REWARD_CYCLE_LENGTH);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(0).value);
  });

  it("stacker: when stacking stopped, STX can be returned to reserve", () => {
    const reserve = new Reserve(deployer);
    const core = new Core(deployer);
    const stacker = new Stacker(deployer);
    const poxMock = new Pox3Mock(deployer);

    // Deposit 150k STX to reserve
    expect(core.deposit(deployer, 150000)).toBeOk(uintWithDecimals(150000));

    //
    // Start stacking
    //
    expect(stacker.initiateStacking(1, deployer, 125000, 0, 1)).toBeOk(uintWithDecimals(125000));

    // Tokens are now locked
    let stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(125000).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(2 * REWARD_CYCLE_LENGTH);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(0).value);

    //
    // Stop stacking
    //

    // Advance to unlock height
    simnet.mineEmptyBlocks(2 * REWARD_CYCLE_LENGTH);

    // Unlock (125k STX will be unlocked)
    expect(poxMock.unlock(deployer, qualifiedName("stacker-1"))).toBeOk(uintWithDecimals(125000));

    // Check if burn height updated
    expect(stacker.getStackingUnlockBurnHeight(1)).toBeUint(2 * REWARD_CYCLE_LENGTH);

    // Check if STX stacked updated
    expect(stacker.getStxStacked(1)).toBeUint(uintWithDecimals(0).value);

    // This var is not reset, which is intended
    expect(stacker.getStackingStxStacked(1)).toBeUint(uintWithDecimals(125000).value);

    // Stacker info
    expect(stacker.getStackerInfo(1)).toBeNone();

    // Account updated
    stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(0);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(125000).value);

    //
    // STX tokens to reserve
    //

    expect(stacker.getStxBalance(1)).toBeUint(uintWithDecimals(125000).value);

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(150000));

    expect(reserve.getStxBalance()).toBeOk(uintWithDecimals(25000));

    expect(reserve.getStxStacking()).toBeOk(uintWithDecimals(125000));

    expect(stacker.returnStx(1, deployer)).toBeOk(uintWithDecimals(125000));

    expect(stacker.getStxBalance(1)).toBeUint(uintWithDecimals(0).value);

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(150000));

    expect(reserve.getStxBalance()).toBeOk(uintWithDecimals(150000));

    expect(reserve.getStxStacking()).toBeOk(uintWithDecimals(0));

    // Account updated
    stxAccount = stacker.getStxAccount(1);
    expect(tupleField(stxAccount, "locked")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(stxAccount, "unlock-height")).toBeUint(0);
    expect(tupleField(stxAccount, "unlocked")).toBeUint(uintWithDecimals(0).value);
  });

  it("stacker: can call return STX even when no balance", () => {
    const stacker = new Stacker(deployer);

    expect(stacker.returnStx(1, deployer)).toBeOk(uintWithDecimals(0));
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("stacker: stacker can stack errors", () => {
    const core = new Core(deployer);
    const stacker = new Stacker(deployer);

    // Deposit 150k STX to reserve
    expect(core.deposit(deployer, 150000)).toBeOk(uintWithDecimals(150000));

    // ERR_INVALID_START_BURN_HEIGHT = 24
    expect(stacker.initiateStacking(1, deployer, 125000, 100000, 1)).toBeErr(Cl.uint(24));
  });

  it("stacker: initiate stacking errors", () => {
    const core = new Core(deployer);
    const stacker = new Stacker(deployer);

    // Not enough balance
    expect(stacker.initiateStacking(1, deployer, 125000, 0, 1)).toBeErr(Cl.uint(1));

    expect(core.deposit(deployer, 150000)).toBeOk(uintWithDecimals(150000));

    // Invalid start burn height
    expect(stacker.initiateStacking(1, deployer, 125000, 100000, 1)).toBeErr(Cl.uint(24));
  });

  it("stacker: stacking extend errors", () => {
    const stacker = new Stacker(deployer);

    // Noting locked
    expect(stacker.stackExtend(1, deployer, 1)).toBeErr(Cl.uint(26));
  });

  it("stacker: stacking increase errors", () => {
    const core = new Core(deployer);
    const stacker = new Stacker(deployer);

    // Insufficient funds
    expect(stacker.stackIncrease(1, deployer, 100)).toBeErr(Cl.uint(1));

    expect(core.deposit(deployer, 150000)).toBeOk(uintWithDecimals(150000));

    // Nothing locked
    expect(stacker.stackIncrease(1, deployer, 100)).toBeErr(Cl.uint(27));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("stacker: only protocol can initiate stacking, only if protocol enabled, with correct reserve", () => {
    const dao = new DAO(deployer);
    const stacker = new Stacker(deployer);

    expect(stacker.initiateStacking(1, wallet_1, 125000, 0, 1)).toBeErr(Cl.uint(20003));

    const { result: fakeResult } = simnet.callPublicFn(
      "stacker-1",
      "initiate-stacking",
      [
        Cl.principal(qualifiedName("fake-reserve")),
        FAKE_POX_ADDR,
        Cl.uint(100 * 1_000_000),
        Cl.uint(0),
        Cl.uint(1),
      ],
      deployer,
    );
    expect(fakeResult).toBeErr(Cl.uint(20003));

    // Set protocol is inactive
    expect(dao.setContractsEnabled(deployer, false)).toBeOk(Cl.bool(true));

    expect(stacker.initiateStacking(1, deployer, 125000, 0, 1)).toBeErr(Cl.uint(20002));
  });

  it("stacker: only protocol can increase stacking, only if protocol enabled, with correct reserve", () => {
    const dao = new DAO(deployer);
    const stacker = new Stacker(deployer);

    expect(stacker.stackIncrease(1, wallet_1, 125000)).toBeErr(Cl.uint(20003));

    const { result: fakeResult } = simnet.callPublicFn(
      "stacker-1",
      "stack-increase",
      [Cl.principal(qualifiedName("fake-reserve")), Cl.uint(100 * 1_000_000)],
      deployer,
    );
    expect(fakeResult).toBeErr(Cl.uint(20003));

    // Set protocol is inactive
    expect(dao.setContractsEnabled(deployer, false)).toBeOk(Cl.bool(true));

    expect(stacker.stackIncrease(1, deployer, 125000)).toBeErr(Cl.uint(20002));
  });

  it("stacker: only protocol can extend stacking, only if protocol enabled", () => {
    const dao = new DAO(deployer);
    const stacker = new Stacker(deployer);

    expect(stacker.stackExtend(1, wallet_1, 1)).toBeErr(Cl.uint(20003));

    // Set protocol is inactive
    expect(dao.setContractsEnabled(deployer, false)).toBeOk(Cl.bool(true));

    expect(stacker.stackExtend(1, deployer, 1)).toBeErr(Cl.uint(20002));
  });

  it("stacker: can only return STX if protocol enabled, with correct reserve", () => {
    const dao = new DAO(deployer);
    const stacker = new Stacker(deployer);

    const { result: fakeResult } = simnet.callPublicFn(
      "stacker-1",
      "return-stx",
      [Cl.principal(qualifiedName("fake-reserve"))],
      wallet_1,
    );
    expect(fakeResult).toBeErr(Cl.uint(20003));

    // Set protocol is inactive
    expect(dao.setContractsEnabled(deployer, false)).toBeOk(Cl.bool(true));

    expect(stacker.returnStx(1, deployer)).toBeErr(Cl.uint(20002));
  });
});
