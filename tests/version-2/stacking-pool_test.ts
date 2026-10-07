import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import {
  hexToBytes,
  mineEmptyBlockUntil,
  okValue,
  qualifiedName,
  tupleField,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { StackingDelegate } from "../wrappers/stacking-delegate-helpers";
import { StackingPool } from "../wrappers/stacking-pool-helpers";
import { Pox4Mock } from "../wrappers/pox-mock-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Signer Signature
//-------------------------------------

describe("stacking-pool", () => {
  it("stacking-pool: signer signature", () => {
    const pox = new Pox4Mock(deployer);

    expect(pox.getSignerKeyMessageHash(1, "agg-commit", 1)).toBeBuff(
      hexToBytes("0x59070b7e9b7bec902fb30e35203e67aa167d92d0e7bd7428b12e8d788e54cad2"),
    );

    expect(pox.getSignerKeyMessageHash(2, "agg-commit", 2)).toBeBuff(
      hexToBytes("0x1265212cd2a8bd891bf01706778f3f151b7ba9f6135089a416b21303352c4c75"),
    );

    expect(pox.getSignerKeyMessageHash(3, "agg-commit", 3)).toBeBuff(
      hexToBytes("0xd1ccd2d48e5844195b94e63b8927dbc7b3452950b4ba45359e7bf2c065b571fa"),
    );

    expect(pox.getSignerKeyMessageHash(4, "agg-commit", 4)).toBeBuff(
      hexToBytes("0x9dc63b92307397a0aca555c92b5cfdb19f9a9c20b5a28c52e900689e5502f5bd"),
    );

    // Public and private key for deployer (ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
    const publicKey =
      "0390a5cac7c33fda49f70bc1b0866fa0ba7a9440d9de647fecb8132ceb76a94dfa";
    // Use script 'create-signer-sig'
    const signedMessage =
      "8e20aadcf90b313731a80ff87363903a97ad75dd553fb90de90a21c44d30bb2c1bf9404441ee900519af0ee50015b398658fd6603dcf8259b0cfacf5377de45b01";

    expect(pox.verifySignerKeySig(1, "agg-commit", signedMessage, publicKey, 1)).toBeOk(Cl.bool(true));
  });

  //-------------------------------------
  // Core
  //-------------------------------------

  it("stacking-pool: prepare", () => {
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPool(deployer);
    stackingPool.addSignatures(deployer);

    //
    // 500k STX to delegate-1-1
    //
    expect(simnet.transferSTX(500000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(
      stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000),
    ).toBeOk(uintWithDecimals(500000));

    let account = stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(500000).value);
    expect(tupleField(account, "unlock-height")).toBeUint(0);

    //
    // Delegate 200k
    //
    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42),
    ).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(14);

    expect(stackingPool.prepare(wallet_1)).toBeOk(Cl.bool(true));

    account = stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(200000).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(500000 - 200000).value);
    expect(tupleField(account, "unlock-height")).toBeUint(42);

    //
    // Prepare again
    //
    expect(stackingDelegate.revokeDelegateStx(deployer, "stacking-delegate-1-1")).toBeOk(Cl.bool(true));
    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 250000, qualifiedName("stacking-pool-v1"), 42),
    ).toBeOk(Cl.bool(true));

    expect(stackingPool.getCycleToIndex(1)).toBeSome(Cl.uint(0));

    expect(stackingPool.prepare(wallet_1)).toBeOk(Cl.bool(true));

    account = stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(250000).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(500000 - 250000).value);
    expect(tupleField(account, "unlock-height")).toBeUint(42);
  });

  it("stacking-pool: can prepare multiple times", () => {
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPool(deployer);
    stackingPool.addSignatures(deployer);

    //
    // 500k STX to delegate-1-1
    //
    expect(simnet.transferSTX(1000000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(
      stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000),
    ).toBeOk(uintWithDecimals(500000));
    expect(
      stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-2", 500000),
    ).toBeOk(uintWithDecimals(500000));

    //
    // Delegate 200k & prepare pool
    //
    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42),
    ).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(18);

    expect(stackingPool.prepare(wallet_1)).toBeOk(Cl.bool(true));

    //
    // Prepare again - Need to have extra delegated
    //
    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-2", 10, qualifiedName("stacking-pool-v1"), 42),
    ).toBeOk(Cl.bool(true));

    expect(stackingPool.prepare(wallet_1)).toBeOk(Cl.bool(true));

    //
    // Check data
    //
    let account = stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(200000).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(500000 - 200000).value);
    expect(tupleField(account, "unlock-height")).toBeUint(42);

    account = stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-2"));
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(10).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(500000 - 10).value);
    expect(tupleField(account, "unlock-height")).toBeUint(42);
  });

  it("stacking-pool: wallet can stack directly", () => {
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPool(deployer);
    const pox = new Pox4Mock(deployer);
    stackingPool.addSignatures(deployer);

    //
    // Delegation contract
    //
    expect(simnet.transferSTX(500000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(
      stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 200000),
    ).toBeOk(uintWithDecimals(200000));

    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42),
    ).toBeOk(Cl.bool(true));

    //
    // Delegation contract
    //
    expect(pox.allowContractCaller(wallet_1, qualifiedName("stacking-pool-v1"))).toBeOk(Cl.bool(true));

    expect(stackingPool.delegateStx(wallet_1, 1000, 99)).toBeOk(Cl.bool(true));

    //
    // Pool prepare
    //
    mineEmptyBlockUntil(18);

    expect(stackingPool.prepare(wallet_1)).toBeOk(Cl.bool(true)); // Prepares StackingDAO

    expect(stackingPool.prepareDelegate(wallet_1, wallet_1)).toBeOk(Cl.bool(true));

    let account = stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(200000).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(account, "unlock-height")).toBeUint(42);

    account = stackingPool.getStxAccount(wallet_1);
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(1000).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(100000000 - 1000).value);
    expect(tupleField(account, "unlock-height")).toBeUint(42);

    // ERR_STACKING_NO_SUCH_PRINCIPAL
    // Can not prepare again as only delegated until burn block 42.
    expect(stackingPool.prepareDelegate(wallet_1, wallet_1)).toBeErr(Cl.uint(4));

    //
    // Revoke
    //
    expect(pox.getCheckDelegation(wallet_1)).toHaveClarityType(10); // OptionalSome

    expect(stackingPool.revokeDelegateStx(wallet_1)).toBeOk(Cl.bool(true));

    expect(pox.getCheckDelegation(wallet_1)).toBeNone();
  });

  it("stacking-pool: can prepare even if threshold not met", () => {
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPool(deployer);
    stackingPool.addSignatures(deployer);

    expect(simnet.transferSTX(500000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(
      stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000),
    ).toBeOk(uintWithDecimals(500000));

    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 50000, qualifiedName("stacking-pool-v1"), 42),
    ).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(18);

    // ERR_STACKING_THRESHOLD_NOT_MET
    expect(stackingPool.prepare(deployer)).toBeOk(Cl.bool(true));
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("stacking-pool: can set pox reward address", () => {
    const stackingPool = new StackingPool(deployer);

    let addr = stackingPool.getPoxRewardAddress();
    expect(tupleField(addr, "version")).toBeBuff(hexToBytes("0x04"));
    expect(tupleField(addr, "hashbytes")).toBeBuff(hexToBytes("0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc"));

    expect(
      stackingPool.setPoxRewardAddress(deployer, "0x01", "0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab"),
    ).toBeOk(Cl.bool(true));

    addr = stackingPool.getPoxRewardAddress();
    expect(tupleField(addr, "version")).toBeBuff(hexToBytes("0x01"));
    expect(tupleField(addr, "hashbytes")).toBeBuff(hexToBytes("0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab"));
  });

  //-------------------------------------
  // PoX Errors
  //-------------------------------------

  it("stacking-pool: can not delegate again without revoking first", () => {
    const stackingDelegate = new StackingDelegate(deployer);

    expect(simnet.transferSTX(500000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(
      stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000),
    ).toBeOk(uintWithDecimals(500000));

    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 50000, qualifiedName("stacking-pool-v1"), 42),
    ).toBeOk(Cl.bool(true));

    // ERR_STACKING_ALREADY_DELEGATED
    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42),
    ).toBeErr(Cl.uint(20));

    // Revoke
    expect(stackingDelegate.revokeDelegateStx(deployer, "stacking-delegate-1-1")).toBeOk(Cl.bool(true));

    // Can delegate again
    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42),
    ).toBeOk(Cl.bool(true));
  });

  it("stacking-pool: can not delegate again if already stacked", () => {
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPool(deployer);

    expect(simnet.transferSTX(500000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(
      stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000),
    ).toBeOk(uintWithDecimals(500000));

    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42),
    ).toBeOk(Cl.bool(true));

    const stackResult = stackingPool.delegateStackStx(deployer, qualifiedName("stacking-delegate-1-1"), 200000);
    const stackInner = okValue(stackResult);
    expect(tupleField(stackInner, "lock-amount")).toBeUint(uintWithDecimals(200000).value);
    expect(tupleField(stackInner, "stacker")).toBePrincipal(qualifiedName("stacking-delegate-1-1"));
    expect(tupleField(stackInner, "unlock-burn-height")).toBeUint(42);

    // ERR_STACKING_ALREADY_STACKED
    expect(
      stackingPool.delegateStackStx(deployer, qualifiedName("stacking-delegate-1-1"), 200000),
    ).toBeErr(Cl.uint(3));

    // Revoke
    expect(stackingDelegate.revokeDelegateStx(deployer, "stacking-delegate-1-1")).toBeOk(Cl.bool(true));

    // Can delegate again
    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42),
    ).toBeOk(Cl.bool(true));
  });

  it("stacking-pool: can not delegate without funds", () => {
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPool(deployer);

    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42),
    ).toBeOk(Cl.bool(true));

    // ERR_STACKING_INSUFFICIENT_FUNDS
    expect(
      stackingPool.delegateStackStx(deployer, qualifiedName("stacking-delegate-1-1"), 200000),
    ).toBeErr(Cl.uint(1));
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("stacking-pool: can only prepare in last blocks", () => {
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPool(deployer);

    expect(simnet.transferSTX(500000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(
      stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000),
    ).toBeOk(uintWithDecimals(500000));

    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42),
    ).toBeOk(Cl.bool(true));

    expect(
      stackingPool.prepareDelegateMany(wallet_1, [qualifiedName("stacking-delegate-1-1")]),
    ).toBeErr(Cl.uint(205001));

    stackingPool.addSignatures(deployer);
    mineEmptyBlockUntil(14);

    expect(
      stackingPool.prepareDelegateMany(wallet_1, [qualifiedName("stacking-delegate-1-1")]),
    ).toBeOk(Cl.bool(true));
  });

  it("stacking-pool: can not prepare delegate if nothing delegated", () => {
    const stackingPool = new StackingPool(deployer);
    stackingPool.addSignatures(deployer);

    mineEmptyBlockUntil(14);

    expect(
      stackingPool.prepareDelegate(wallet_1, qualifiedName("stacking-delegate-1-1")),
    ).toBeErr(Cl.uint(4));

    expect(
      stackingPool.prepareDelegateMany(wallet_1, [qualifiedName("stacking-delegate-1-1")]),
    ).toBeErr(Cl.uint(4));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("stacking-pool: only protocol can use pox wrapper methods", () => {
    const stackingPool = new StackingPool(deployer);

    expect(stackingPool.delegateStackStx(wallet_1, wallet_1, 100)).toBeErr(Cl.uint(20003));

    expect(stackingPool.delegateStackExtend(wallet_1, wallet_1)).toBeErr(Cl.uint(20003));

    expect(stackingPool.delegateStackIncrease(wallet_1, wallet_1, 10)).toBeErr(Cl.uint(20003));

    expect(stackingPool.stackAggregationCommitIndexed(wallet_1, 10)).toBeErr(Cl.uint(20003));

    expect(stackingPool.stackAggregationIncrease(wallet_1, 2, 2)).toBeErr(Cl.uint(20003));
  });

  it("stacking-pool: only protocol can set pox reward address", () => {
    const stackingPool = new StackingPool(deployer);

    expect(
      stackingPool.setPoxRewardAddress(wallet_1, "0x01", "0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab"),
    ).toBeErr(Cl.uint(20003));
  });
});
