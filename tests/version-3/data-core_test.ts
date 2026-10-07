import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import {
  mineEmptyBlockUntil,
  qualifiedName,
  tupleField,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { DataCore, DataCoreV2 } from "../wrappers/data-core-helpers";
import { Core, CoreV1 } from "../wrappers/stacking-dao-core-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Protocol
//-------------------------------------

describe("data-core", () => {
  it("data-core-v2: STX per stSTX", () => {
    const dataCore = new DataCoreV2(deployer);
    const core = new Core(deployer);

    expect(core.deposit(wallet_1, 1000, undefined, qualifiedName("stacking-pool-v1"))).toBeOk(uintWithDecimals(1000));

    expect(dataCore.getStxPerStStx(qualifiedName("reserve-v1"))).toBeOk(uintWithDecimals(1));

    expect(dataCore.getStxPerStStxHelper(1000)).toBeUint(uintWithDecimals(1).value);

    expect(simnet.transferSTX(100 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(dataCore.getStxPerStStx(qualifiedName("reserve-v1"))).toBeOk(uintWithDecimals(1.1));

    expect(dataCore.getStxPerStStxHelper(1100)).toBeUint(uintWithDecimals(1.1).value);
  });

  it("data-core: protocol can set withdraw offset", () => {
    const dataCore = new DataCore(deployer);

    expect(dataCore.getCycleWithdrawOffset()).toBeUint(10);

    expect(dataCore.setCycleWithdrawOffset(deployer, 8)).toBeOk(Cl.bool(true));

    expect(dataCore.getCycleWithdrawOffset()).toBeUint(8);
  });

  it("data-core: protocol can set withdraw nft", () => {
    const dataCore = new DataCore(deployer);

    let info = dataCore.getWithdrawalsByNft(5);
    expect(tupleField(info, "stx-amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(info, "ststx-amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(info, "unlock-burn-height")).toBeUint(0);

    expect(dataCore.setWithdrawalsByNft(deployer, 5, 100, 99, 30)).toBeOk(Cl.bool(true));

    info = dataCore.getWithdrawalsByNft(5);
    expect(tupleField(info, "stx-amount")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(info, "ststx-amount")).toBeUint(uintWithDecimals(99).value);
    expect(tupleField(info, "unlock-burn-height")).toBeUint(30);
  });

  it("data-core-v2: protocol can set ststxbtc withdraw nft", () => {
    const dataCore = new DataCoreV2(deployer);

    let info = dataCore.getStStxBtcWithdrawalsByNft(5);
    expect(tupleField(info, "stx-amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(info, "unlock-burn-height")).toBeUint(0);

    expect(dataCore.setStStxBtcWithdrawalsByNft(deployer, 5, 100, 30)).toBeOk(Cl.bool(true));

    info = dataCore.getStStxBtcWithdrawalsByNft(5);
    expect(tupleField(info, "stx-amount")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(info, "unlock-burn-height")).toBeUint(30);
  });

  it("data-core: protocol can delete withdraw nft", () => {
    const dataCore = new DataCore(deployer);

    expect(dataCore.setWithdrawalsByNft(deployer, 5, 100, 99, 30)).toBeOk(Cl.bool(true));

    let info = dataCore.getWithdrawalsByNft(5);
    expect(tupleField(info, "stx-amount")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(info, "ststx-amount")).toBeUint(uintWithDecimals(99).value);
    expect(tupleField(info, "unlock-burn-height")).toBeUint(30);

    expect(dataCore.deleteWithdrawalsByNft(deployer, 5)).toBeOk(Cl.bool(true));

    info = dataCore.getWithdrawalsByNft(5);
    expect(tupleField(info, "stx-amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(info, "ststx-amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(info, "unlock-burn-height")).toBeUint(0);
  });

  it("data-core-v2: protocol can delete ststxbtc withdraw nft", () => {
    const dataCore = new DataCoreV2(deployer);

    expect(dataCore.setStStxBtcWithdrawalsByNft(deployer, 5, 100, 30)).toBeOk(Cl.bool(true));

    let info = dataCore.getStStxBtcWithdrawalsByNft(5);
    expect(tupleField(info, "stx-amount")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(info, "unlock-burn-height")).toBeUint(30);

    expect(dataCore.deleteStStxBtcWWithdrawalsByNft(deployer, 5)).toBeOk(Cl.bool(true));

    info = dataCore.getStStxBtcWithdrawalsByNft(5);
    expect(tupleField(info, "stx-amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(info, "unlock-burn-height")).toBeUint(0);
  });

  it("data-core: protocol can set withdraw inset", () => {
    const dataCore = new DataCoreV2(deployer);

    expect(dataCore.getCycleWithdrawInset()).toBeUint(3);

    expect(dataCore.setCycleWithdrawInset(deployer, 8)).toBeOk(Cl.bool(true));

    expect(dataCore.getCycleWithdrawInset()).toBeUint(8);
  });

  it("data-core-v2: protocol can update stx idle", () => {
    const dataCore = new DataCoreV2(deployer);

    expect(dataCore.getStxIdle(5)).toBeUint(uintWithDecimals(0).value);

    expect(dataCore.setStxIdle(deployer, 5, 100)).toBeOk(Cl.bool(true));

    expect(dataCore.getStxIdle(5)).toBeUint(uintWithDecimals(100).value);

    expect(dataCore.increaseStxIdle(deployer, 5, 10)).toBeOk(Cl.bool(true));

    expect(dataCore.getStxIdle(5)).toBeUint(uintWithDecimals(100 + 10).value);

    expect(dataCore.decreaseStxIdle(deployer, 5, 20)).toBeOk(Cl.bool(true));

    expect(dataCore.getStxIdle(5)).toBeUint(uintWithDecimals(100 + 10 - 20).value);
  });

  //-------------------------------------
  // Withdrawal NFT V1
  //-------------------------------------

  it("data-core: can get legacy withdrawal info", () => {
    const dataCore = new DataCore(deployer);
    const coreV1 = new CoreV1(deployer);

    expect(coreV1.deposit(wallet_1, 1000, undefined)).toBeOk(uintWithDecimals(1000));

    expect(coreV1.initWithdraw(wallet_1, 800)).toBeOk(uintWithDecimals(0));

    let info = dataCore.getWithdrawalsByNft(0);
    expect(tupleField(info, "stx-amount")).toBeUint(uintWithDecimals(800).value);
    expect(tupleField(info, "ststx-amount")).toBeUint(uintWithDecimals(800).value);
    expect(tupleField(info, "unlock-burn-height")).toBeUint(21);

    mineEmptyBlockUntil(26);

    // Old core
    expect(coreV1.withdraw(wallet_1, 0)).toBeOk(uintWithDecimals(800));

    info = dataCore.getWithdrawalsByNft(0);
    expect(tupleField(info, "stx-amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(info, "ststx-amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(info, "unlock-burn-height")).toBeUint(0);
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("data-core: only protocol can use setters", () => {
    const dataCore = new DataCore(deployer);
    const dataCoreV2 = new DataCoreV2(deployer);

    expect(dataCore.setCycleWithdrawOffset(wallet_1, 8)).toBeErr(Cl.uint(20003));

    expect(dataCore.setWithdrawalsByNft(wallet_1, 5, 100, 99, 30)).toBeErr(Cl.uint(20003));

    expect(dataCore.deleteWithdrawalsByNft(wallet_1, 5)).toBeErr(Cl.uint(20003));

    expect(dataCoreV2.setCycleWithdrawInset(wallet_1, 8)).toBeErr(Cl.uint(20003));

    expect(dataCoreV2.setStStxBtcWithdrawalsByNft(wallet_1, 5, 100, 30)).toBeErr(Cl.uint(20003));

    expect(dataCoreV2.deleteStStxBtcWWithdrawalsByNft(wallet_1, 5)).toBeErr(Cl.uint(20003));

    expect(dataCoreV2.setStxIdle(wallet_1, 1, 100)).toBeErr(Cl.uint(20003));

    expect(dataCoreV2.increaseStxIdle(wallet_1, 1, 100)).toBeErr(Cl.uint(20003));

    expect(dataCoreV2.decreaseStxIdle(wallet_1, 1, 100)).toBeErr(Cl.uint(20003));
  });
});
