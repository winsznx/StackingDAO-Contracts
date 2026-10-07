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
import { StackingPoolSigner } from "../wrappers/stacking-pool-signer-helpers";
import { DataPools } from "../wrappers/data-pools-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Core
//-------------------------------------

describe("stacking-pool-signer", () => {
  it("stacking-pool-signer: prepare", () => {
    const dataPools = new DataPools(deployer);
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPoolSigner(deployer);
    stackingPool.addSignatures(deployer);

    //
    // Setup pool
    //
    expect(dataPools.setActivePools(deployer, [qualifiedName("stacking-pool-signer-v1")])).toBeOk(Cl.bool(true));

    expect(
      dataPools.setPoolDelegates(deployer, qualifiedName("stacking-pool-signer-v1"), [qualifiedName("stacking-delegate-1-1")]),
    ).toBeOk(Cl.bool(true));

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
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42),
    ).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(15);

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
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 250000, qualifiedName("stacking-pool-signer-v1"), 42),
    ).toBeOk(Cl.bool(true));

    expect(stackingPool.getCycleToIndex(1)).toBeSome(Cl.uint(0));

    expect(stackingPool.prepare(wallet_1)).toBeOk(Cl.bool(true));

    account = stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    expect(tupleField(account, "locked")).toBeUint(uintWithDecimals(250000).value);
    expect(tupleField(account, "unlocked")).toBeUint(uintWithDecimals(500000 - 250000).value);
    expect(tupleField(account, "unlock-height")).toBeUint(42);
  });

  it("stacking-pool-signer: can prepare multiple times", () => {
    const dataPools = new DataPools(deployer);
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPoolSigner(deployer);
    stackingPool.addSignatures(deployer);

    //
    // Setup pool
    //
    expect(dataPools.setActivePools(deployer, [qualifiedName("stacking-pool-signer-v1")])).toBeOk(Cl.bool(true));

    expect(
      dataPools.setPoolDelegates(deployer, qualifiedName("stacking-pool-signer-v1"), [qualifiedName("stacking-delegate-1-1"), qualifiedName("stacking-delegate-1-2")]),
    ).toBeOk(Cl.bool(true));

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
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42),
    ).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(18);

    expect(stackingPool.prepare(wallet_1)).toBeOk(Cl.bool(true));

    //
    // Prepare again - Need to have extra delegated
    //
    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-2", 10, qualifiedName("stacking-pool-signer-v1"), 42),
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

  it("stacking-pool-signer: can prepare even if threshold not met", () => {
    const dataPools = new DataPools(deployer);
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPoolSigner(deployer);
    stackingPool.addSignatures(deployer);

    //
    // Setup pool
    //
    expect(dataPools.setActivePools(deployer, [qualifiedName("stacking-pool-signer-v1")])).toBeOk(Cl.bool(true));

    expect(
      dataPools.setPoolDelegates(deployer, qualifiedName("stacking-pool-signer-v1"), [qualifiedName("stacking-delegate-1-1"), qualifiedName("stacking-delegate-1-2")]),
    ).toBeOk(Cl.bool(true));

    expect(simnet.transferSTX(500000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(
      stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000),
    ).toBeOk(uintWithDecimals(500000));

    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 50000, qualifiedName("stacking-pool-signer-v1"), 42),
    ).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(18);

    // ERR_STACKING_THRESHOLD_NOT_MET
    expect(stackingPool.prepare(deployer)).toBeOk(Cl.bool(true));
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("stacking-pool-signer: can set new owner", () => {
    const stackingPool = new StackingPoolSigner(deployer);

    expect(stackingPool.getPoolOwner()).toBePrincipal(deployer);

    expect(stackingPool.setPoolOwner(deployer, wallet_1)).toBeOk(Cl.bool(true));

    expect(stackingPool.getPoolOwner()).toBePrincipal(wallet_1);
  });

  it("stacking-pool-signer: can set pox reward address", () => {
    const stackingPool = new StackingPoolSigner(deployer);

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

  it("stacking-pool-signer: can not delegate again without revoking first", () => {
    const stackingDelegate = new StackingDelegate(deployer);

    expect(simnet.transferSTX(500000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(
      stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000),
    ).toBeOk(uintWithDecimals(500000));

    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 50000, qualifiedName("stacking-pool-signer-v1"), 42),
    ).toBeOk(Cl.bool(true));

    // ERR_STACKING_ALREADY_DELEGATED
    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42),
    ).toBeErr(Cl.uint(20));

    // Revoke
    expect(stackingDelegate.revokeDelegateStx(deployer, "stacking-delegate-1-1")).toBeOk(Cl.bool(true));

    // Can delegate again
    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42),
    ).toBeOk(Cl.bool(true));
  });

  it("stacking-pool-signer: can not delegate again if already stacked", () => {
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPoolSigner(deployer);

    expect(simnet.transferSTX(500000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(
      stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000),
    ).toBeOk(uintWithDecimals(500000));

    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42),
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
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42),
    ).toBeOk(Cl.bool(true));
  });

  it("stacking-pool-signer: can not delegate without funds", () => {
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPoolSigner(deployer);

    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42),
    ).toBeOk(Cl.bool(true));

    // ERR_STACKING_INSUFFICIENT_FUNDS
    expect(
      stackingPool.delegateStackStx(deployer, qualifiedName("stacking-delegate-1-1"), 200000),
    ).toBeErr(Cl.uint(1));
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("stacking-pool-signer: can only prepare in last blocks", () => {
    const dataPools = new DataPools(deployer);

    //
    // Setup pool
    //
    expect(dataPools.setActivePools(deployer, [qualifiedName("stacking-pool-signer-v1")])).toBeOk(Cl.bool(true));

    expect(
      dataPools.setPoolDelegates(deployer, qualifiedName("stacking-pool-signer-v1"), [qualifiedName("stacking-delegate-1-1")]),
    ).toBeOk(Cl.bool(true));

    // Go to next cycle
    mineEmptyBlockUntil(22);

    //
    // Prepare
    //
    const stackingDelegate = new StackingDelegate(deployer);
    const stackingPool = new StackingPoolSigner(deployer);
    stackingPool.addSignatures(deployer);

    expect(simnet.transferSTX(500000 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(
      stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000),
    ).toBeOk(uintWithDecimals(500000));

    expect(
      stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 63),
    ).toBeOk(Cl.bool(true));

    expect(stackingPool.prepare(wallet_1)).toBeErr(Cl.uint(99502));

    mineEmptyBlockUntil(41);

    expect(stackingPool.prepare(wallet_1)).toBeOk(Cl.bool(true));
  });

  it("stacking-pool-signer: can not prepare delegate if nothing delegated", () => {
    const stackingPool = new StackingPoolSigner(deployer);
    stackingPool.addSignatures(deployer);

    mineEmptyBlockUntil(15);

    expect(stackingPool.prepare(wallet_1)).toBeErr(Cl.uint(4));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("stacking-pool-signer: only pool owner can use pox wrapper methods", () => {
    const stackingPool = new StackingPoolSigner(deployer);

    expect(stackingPool.delegateStackStx(wallet_1, wallet_1, 100)).toBeErr(Cl.uint(99501));

    expect(stackingPool.delegateStackExtend(wallet_1, wallet_1)).toBeErr(Cl.uint(99501));

    expect(stackingPool.delegateStackIncrease(wallet_1, wallet_1, 10)).toBeErr(Cl.uint(99501));

    expect(stackingPool.stackAggregationCommitIndexed(wallet_1, 10)).toBeErr(Cl.uint(99501));

    expect(stackingPool.stackAggregationIncrease(wallet_1, 2, 2)).toBeErr(Cl.uint(99501));
  });

  it("stacking-pool-signer: only pool owner can use admin functions", () => {
    const stackingPool = new StackingPoolSigner(deployer);

    expect(
      stackingPool.setPoxRewardAddress(wallet_1, "0x01", "0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab"),
    ).toBeErr(Cl.uint(99501));

    expect(stackingPool.setPoolOwner(wallet_1, deployer)).toBeErr(Cl.uint(99501));
  });
});
