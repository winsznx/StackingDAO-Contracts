import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import {
  mineEmptyBlockUntil,
  qualifiedName,
  tupleField,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { StackingPool } from "../wrappers/stacking-pool-helpers";
import { StackingPoolPayout } from "../wrappers/stacking-pool-payout-helpers";
import { Pox4Mock } from "../wrappers/pox-mock-helpers";
import { CoreV1 } from "../wrappers/stacking-dao-core-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;

//-------------------------------------
// Core
//-------------------------------------

describe("stacking-pool-payout", () => {
  it("stacking-pool-payout: add rewards and distribute", () => {
    const stackingPool = new StackingPool(deployer);
    const stackingPoolPayout = new StackingPoolPayout(deployer);
    const pox = new Pox4Mock(deployer);
    stackingPool.addSignatures(deployer);

    //
    // Stack
    //
    expect(pox.allowContractCaller(wallet_1, qualifiedName("stacking-pool-v1"))).toBeOk(Cl.bool(true));
    expect(stackingPool.delegateStx(wallet_1, 50000, 99)).toBeOk(Cl.bool(true));

    expect(pox.allowContractCaller(wallet_2, qualifiedName("stacking-pool-v1"))).toBeOk(Cl.bool(true));
    expect(stackingPool.delegateStx(wallet_2, 100000, 99)).toBeOk(Cl.bool(true));

    expect(pox.allowContractCaller(wallet_3, qualifiedName("stacking-pool-v1"))).toBeOk(Cl.bool(true));
    expect(stackingPool.delegateStx(wallet_3, 10000, 99)).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(18);

    expect(stackingPool.prepareDelegate(wallet_1, wallet_1)).toBeOk(Cl.bool(true));
    expect(stackingPool.prepareDelegate(wallet_2, wallet_2)).toBeOk(Cl.bool(true));
    expect(stackingPool.prepareDelegate(wallet_3, wallet_3)).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(23);

    //
    // Getters
    //
    expect(stackingPoolPayout.getTotalStacked(1)).toBeOk(uintWithDecimals(50000 + 100000 + 10000));

    expect(stackingPoolPayout.getUserStacked(wallet_1, 1)).toBeOk(uintWithDecimals(50000));

    expect(stackingPoolPayout.getUserStacked(wallet_2, 1)).toBeOk(uintWithDecimals(100000));

    expect(stackingPoolPayout.getUserStacked(wallet_3, 1)).toBeOk(uintWithDecimals(10000));

    //
    // Deposit rewards
    //
    expect(stackingPoolPayout.depositRewards(deployer, 200, 1)).toBeOk(Cl.bool(true));

    expect(stackingPoolPayout.getLastRewardId()).toBeUint(1);

    let rewards = stackingPoolPayout.getRewardsInfo(0);
    expect(tupleField(rewards, "amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(rewards, "amount-distributed")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(rewards, "cycle")).toBeUint(1);
    expect(tupleField(rewards, "total-stacked")).toBeUint(uintWithDecimals(50000 + 100000 + 10000).value);

    //
    // Distribute rewards
    //

    // Wallet_1 has 31.25% of total stacked
    // 31.25% of 200 STX rewards = 62.5
    expect(stackingPoolPayout.distributeRewards(deployer, [wallet_1], 0)).toBeOk(uintWithDecimals(62.5));

    rewards = stackingPoolPayout.getRewardsInfo(0);
    expect(tupleField(rewards, "amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(rewards, "amount-distributed")).toBeUint(uintWithDecimals(62.5).value);
    expect(tupleField(rewards, "cycle")).toBeUint(1);
    expect(tupleField(rewards, "total-stacked")).toBeUint(uintWithDecimals(50000 + 100000 + 10000).value);

    expect(stackingPoolPayout.distributeRewards(deployer, [wallet_2, wallet_3], 0)).toBeOk(uintWithDecimals(200 - 62.5));

    rewards = stackingPoolPayout.getRewardsInfo(0);
    expect(tupleField(rewards, "amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(rewards, "amount-distributed")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(rewards, "cycle")).toBeUint(1);
    expect(tupleField(rewards, "total-stacked")).toBeUint(uintWithDecimals(50000 + 100000 + 10000).value);
  });

  it("stacking-pool-payout: rewards are only distributed once per user", () => {
    const stackingPool = new StackingPool(deployer);
    const stackingPoolPayout = new StackingPoolPayout(deployer);
    const pox = new Pox4Mock(deployer);
    stackingPool.addSignatures(deployer);

    //
    // Stack
    //
    expect(pox.allowContractCaller(wallet_1, qualifiedName("stacking-pool-v1"))).toBeOk(Cl.bool(true));
    expect(stackingPool.delegateStx(wallet_1, 50000, 99)).toBeOk(Cl.bool(true));

    expect(pox.allowContractCaller(wallet_2, qualifiedName("stacking-pool-v1"))).toBeOk(Cl.bool(true));
    expect(stackingPool.delegateStx(wallet_2, 100000, 99)).toBeOk(Cl.bool(true));

    expect(pox.allowContractCaller(wallet_3, qualifiedName("stacking-pool-v1"))).toBeOk(Cl.bool(true));
    expect(stackingPool.delegateStx(wallet_3, 10000, 99)).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(18);

    expect(stackingPool.prepareDelegate(wallet_1, wallet_1)).toBeOk(Cl.bool(true));
    expect(stackingPool.prepareDelegate(wallet_2, wallet_2)).toBeOk(Cl.bool(true));
    expect(stackingPool.prepareDelegate(wallet_3, wallet_3)).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(23);

    //
    // Deposit rewards
    //
    expect(stackingPoolPayout.depositRewards(deployer, 200, 1)).toBeOk(Cl.bool(true));

    //
    // Distribute rewards
    //

    // Wallet_1 has 31.25% of total stacked
    // 31.25% of 200 STX rewards = 62.5
    expect(stackingPoolPayout.distributeRewards(deployer, [wallet_1], 0)).toBeOk(uintWithDecimals(62.5));

    let rewards = stackingPoolPayout.getRewardsInfo(0);
    expect(tupleField(rewards, "amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(rewards, "amount-distributed")).toBeUint(uintWithDecimals(62.5).value);
    expect(tupleField(rewards, "cycle")).toBeUint(1);
    expect(tupleField(rewards, "total-stacked")).toBeUint(uintWithDecimals(50000 + 100000 + 10000).value);

    expect(stackingPoolPayout.distributeRewards(deployer, [wallet_1], 0)).toBeOk(uintWithDecimals(0));

    rewards = stackingPoolPayout.getRewardsInfo(0);
    expect(tupleField(rewards, "amount")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(rewards, "amount-distributed")).toBeUint(uintWithDecimals(62.5).value);
    expect(tupleField(rewards, "cycle")).toBeUint(1);
    expect(tupleField(rewards, "total-stacked")).toBeUint(uintWithDecimals(50000 + 100000 + 10000).value);
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("stacking-pool-payout: get stx", () => {
    const stackingPool = new StackingPool(deployer);
    const stackingPoolPayout = new StackingPoolPayout(deployer);
    const pox = new Pox4Mock(deployer);
    const coreV1 = new CoreV1(deployer);
    stackingPool.addSignatures(deployer);

    //
    // Stack
    //
    expect(pox.allowContractCaller(wallet_1, qualifiedName("stacking-pool-v1"))).toBeOk(Cl.bool(true));
    expect(stackingPool.delegateStx(wallet_1, 200000, 99)).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(18);

    expect(stackingPool.prepareDelegate(wallet_1, wallet_1)).toBeOk(Cl.bool(true));

    mineEmptyBlockUntil(23);

    //
    // Deposit rewards
    //
    expect(stackingPoolPayout.depositRewards(deployer, 200, 1)).toBeOk(Cl.bool(true));

    //
    // Get STX
    //
    expect(coreV1.getStxBalance(deployer)).toBeUint(uintWithDecimals(99999800).value);

    expect(coreV1.getStxBalance(qualifiedName("stacking-pool-payout-v1"))).toBeUint(uintWithDecimals(200).value);

    expect(stackingPoolPayout.getStx(deployer, 200, deployer)).toBeOk(uintWithDecimals(200));

    expect(coreV1.getStxBalance(deployer)).toBeUint(uintWithDecimals(99999800 + 200).value);

    expect(coreV1.getStxBalance(qualifiedName("stacking-pool-payout-v1"))).toBeUint(uintWithDecimals(0).value);
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("stacking-pool-payout: can not get user stacked for future cycle", () => {
    const stackingPoolPayout = new StackingPoolPayout(deployer);

    expect(stackingPoolPayout.getUserStacked(wallet_1, 1)).toBeErr(Cl.uint(2015001));
  });

  it("stacking-pool-payout: can not get total stacked for future cycle", () => {
    const stackingPoolPayout = new StackingPoolPayout(deployer);

    expect(stackingPoolPayout.getTotalStacked(1)).toBeErr(Cl.uint(2015002));
  });

  it("stacking-pool-payout: can not add rewards for future cycle", () => {
    const stackingPoolPayout = new StackingPoolPayout(deployer);

    expect(stackingPoolPayout.depositRewards(deployer, 200, 1)).toBeErr(Cl.uint(2015004));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("stacking-pool-payout: only protocol can get stx", () => {
    const stackingPoolPayout = new StackingPoolPayout(deployer);

    expect(stackingPoolPayout.getStx(wallet_1, 200, wallet_1)).toBeErr(Cl.uint(20003));
  });
});
