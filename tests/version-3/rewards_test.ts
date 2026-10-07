import { describe, expect, it } from "vitest";
import { Cl, ClarityType } from "@stacks/transactions";

import {
  mineEmptyBlockUntil,
  okValue,
  qualifiedName,
  tupleField,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { Rewards } from "../wrappers/rewards-helpers";
import { Reserve } from "../wrappers/reserve-helpers";
import { DataPools } from "../wrappers/data-pools-helpers";
import { CoreV1 } from "../wrappers/stacking-dao-core-helpers";
import { SBtcToken } from "../wrappers/sbtc-token-helpers";
import { StStxBtcTokenV1, StStxBtcToken } from "../wrappers/ststxbtc-token-helpers";
import { StStxBtcTracking } from "../wrappers/ststxbtc-tracking-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;

//-------------------------------------
// Core
//-------------------------------------

describe("rewards", () => {
  it("rewards-v4: rewards are split between ststxbtc-tracking and ststxbtc-tracking-v2", () => {
    const rewards = new Rewards(deployer);
    const sBtcToken = new SBtcToken(deployer);
    const stStxBtcTokenV1 = new StStxBtcTokenV1(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);

    // Mint sBTC tokens for rewards
    expect(sBtcToken.protocolMint(deployer, 1000, deployer)).toBeOk(Cl.bool(true));

    // Mint stStxBtcTokenV1 tokens to wallet_1
    expect(stStxBtcTokenV1.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));

    // Mint stStxBtcTokenV1 tokens to wallet_2
    expect(stStxBtcTokenV1.mintForProtocol(deployer, 2000, wallet_2)).toBeOk(Cl.bool(true));

    // Mint stStxBtcToken tokens to wallet_2
    expect(stStxBtcToken.mintForProtocol(deployer, 2000, wallet_2)).toBeOk(Cl.bool(true));

    // Add rewards
    expect(rewards.addRewardsSBtc(deployer, qualifiedName("stacking-pool-v1"), 500)).toBeOk(Cl.bool(true));

    // Go to end of next cycle
    mineEmptyBlockUntil(21 * 2 + 1);

    // Process all rewards
    let processed = okValue(rewards.processRewards(deployer, 0));
    expect(tupleField(processed, "total-intervals")).toBeUint(7);
    expect(tupleField(processed, "past-intervals")).toBeUint(7);
    expect(tupleField(processed, "commission-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(processed, "protocol-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(processed, "commission-sbtc")).toBeUint(uintWithDecimals(25).value);
    expect(tupleField(processed, "protocol-sbtc")).toBeUint(uintWithDecimals(475).value);

    // Check rewards in tracking contracts
    let call = simnet.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-pending-rewards",
      [Cl.principal(wallet_1), Cl.principal(wallet_1)],
      deployer,
    ).result;
    expect(call).toBeOk(uintWithDecimals(95));

    call = simnet.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-pending-rewards",
      [Cl.principal(wallet_2), Cl.principal(wallet_2)],
      deployer,
    ).result;
    expect(call).toBeOk(uintWithDecimals(190));

    expect(stStxBtcTracking.getPendingRewards(wallet_1, wallet_1)).toBeOk(uintWithDecimals(0));
    expect(stStxBtcTracking.getPendingRewards(wallet_2, wallet_2)).toBeOk(uintWithDecimals(190));

    // Claim rewards
    let claim = simnet.callPublicFn(
      "ststxbtc-tracking",
      "claim-pending-rewards",
      [Cl.principal(wallet_1), Cl.principal(wallet_1)],
      wallet_1,
    ).result;
    expect(claim).toBeOk(uintWithDecimals(95));

    claim = simnet.callPublicFn(
      "ststxbtc-tracking",
      "claim-pending-rewards",
      [Cl.principal(wallet_2), Cl.principal(wallet_2)],
      wallet_2,
    ).result;
    expect(claim).toBeOk(uintWithDecimals(190));

    expect(stStxBtcTracking.claimPendingRewards(wallet_1, wallet_1, wallet_1)).toBeOk(uintWithDecimals(0));

    expect(stStxBtcTracking.claimPendingRewards(wallet_2, wallet_2, wallet_2)).toBeOk(uintWithDecimals(190));

    // Verify final balances
    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(95));

    expect(sBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(380));
  });

  it("rewards-v4: add rewards and process", () => {
    const rewards = new Rewards(deployer);
    const reserve = new Reserve(deployer);
    const sBtcToken = new SBtcToken(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.mintForProtocol(deployer, 1000, deployer)).toBeOk(Cl.bool(true));

    let ststx = rewards.getCycleRewardsStStx(0);
    expect(tupleField(ststx, "total-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststx, "commission-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststx, "protocol-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststx, "processed-commission-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststx, "processed-protocol-stx")).toBeUint(uintWithDecimals(0).value);

    let ststxbtc = rewards.getCycleRewardsStStxBtc(0);
    expect(tupleField(ststxbtc, "total-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststxbtc, "commission-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststxbtc, "protocol-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststxbtc, "processed-commission-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststxbtc, "processed-protocol-sbtc")).toBeUint(uintWithDecimals(0).value);

    expect(rewards.addRewards(deployer, qualifiedName("stacking-pool-v1"), 100)).toBeOk(Cl.bool(true));
    expect(rewards.addRewardsSBtc(deployer, qualifiedName("stacking-pool-v1"), 10)).toBeOk(Cl.bool(true));

    ststx = rewards.getCycleRewardsStStx(0);
    expect(tupleField(ststx, "total-stx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(ststx, "commission-stx")).toBeUint(uintWithDecimals(5).value);
    expect(tupleField(ststx, "protocol-stx")).toBeUint(uintWithDecimals(95).value);
    expect(tupleField(ststx, "processed-commission-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststx, "processed-protocol-stx")).toBeUint(uintWithDecimals(0).value);

    ststxbtc = rewards.getCycleRewardsStStxBtc(0);
    expect(tupleField(ststxbtc, "total-sbtc")).toBeUint(uintWithDecimals(10).value);
    expect(tupleField(ststxbtc, "commission-sbtc")).toBeUint(uintWithDecimals(0.5).value);
    expect(tupleField(ststxbtc, "protocol-sbtc")).toBeUint(uintWithDecimals(9.5).value);
    expect(tupleField(ststxbtc, "processed-commission-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststxbtc, "processed-protocol-sbtc")).toBeUint(uintWithDecimals(0).value);

    // Go to end of cycle
    mineEmptyBlockUntil(21);

    let should = rewards.shouldProcessRewards(0);
    expect(tupleField(should, "total-intervals")).toBeUint(7);
    expect(tupleField(should, "past-intervals")).toBeUint(0);
    expect(tupleField(should, "commission-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(should, "protocol-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(should, "commission-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(should, "protocol-sbtc")).toBeUint(uintWithDecimals(0).value);

    // Advance first interval
    mineEmptyBlockUntil(21 + 4);

    should = rewards.shouldProcessRewards(0);
    expect(tupleField(should, "total-intervals")).toBeUint(7);
    expect(tupleField(should, "past-intervals")).toBeUint(1);
    expect(tupleField(should, "commission-stx")).toBeUint(uintWithDecimals(0.714285).value);
    expect(tupleField(should, "protocol-stx")).toBeUint(uintWithDecimals(13.571428).value);
    expect(tupleField(should, "commission-sbtc")).toBeUint(uintWithDecimals(0.071428).value);
    expect(tupleField(should, "protocol-sbtc")).toBeUint(uintWithDecimals(1.357142).value);

    let processed = okValue(rewards.processRewards(deployer, 0));
    expect(tupleField(processed, "total-intervals")).toBeUint(7);
    expect(tupleField(processed, "past-intervals")).toBeUint(1);

    should = rewards.shouldProcessRewards(0);
    expect(tupleField(should, "commission-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(should, "protocol-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(should, "commission-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(should, "protocol-sbtc")).toBeUint(uintWithDecimals(0).value);

    // Advance to third cycle
    mineEmptyBlockUntil(21 + 21 + 21 + 1);

    should = rewards.shouldProcessRewards(0);
    expect(tupleField(should, "total-intervals")).toBeUint(7);
    expect(tupleField(should, "past-intervals")).toBeUint(7);
    expect(tupleField(should, "commission-stx")).toBeUint(uintWithDecimals(4.285715).value);
    expect(tupleField(should, "protocol-stx")).toBeUint(uintWithDecimals(81.428572).value);
    expect(tupleField(should, "commission-sbtc")).toBeUint(uintWithDecimals(0.428572).value);
    expect(tupleField(should, "protocol-sbtc")).toBeUint(uintWithDecimals(8.142858).value);

    processed = okValue(rewards.processRewards(deployer, 0));
    expect(tupleField(processed, "total-intervals")).toBeUint(7);
    expect(tupleField(processed, "past-intervals")).toBeUint(7);

    should = rewards.shouldProcessRewards(0);
    expect(tupleField(should, "commission-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(should, "protocol-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(should, "commission-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(should, "protocol-sbtc")).toBeUint(uintWithDecimals(0).value);

    ststx = rewards.getCycleRewardsStStx(0);
    expect(tupleField(ststx, "total-stx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(ststx, "commission-stx")).toBeUint(uintWithDecimals(5).value);
    expect(tupleField(ststx, "protocol-stx")).toBeUint(uintWithDecimals(95).value);
    expect(tupleField(ststx, "processed-commission-stx")).toBeUint(uintWithDecimals(5).value);
    expect(tupleField(ststx, "processed-protocol-stx")).toBeUint(uintWithDecimals(95).value);

    ststxbtc = rewards.getCycleRewardsStStxBtc(0);
    expect(tupleField(ststxbtc, "total-sbtc")).toBeUint(uintWithDecimals(10).value);
    expect(tupleField(ststxbtc, "commission-sbtc")).toBeUint(uintWithDecimals(0.5).value);
    expect(tupleField(ststxbtc, "protocol-sbtc")).toBeUint(uintWithDecimals(9.5).value);
    expect(tupleField(ststxbtc, "processed-commission-sbtc")).toBeUint(uintWithDecimals(0.5).value);
    expect(tupleField(ststxbtc, "processed-protocol-sbtc")).toBeUint(uintWithDecimals(9.5).value);

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(95));
  });

  it("rewards-v4: pool owner share", () => {
    const rewards = new Rewards(deployer);
    const dataPools = new DataPools(deployer);
    const coreV1 = new CoreV1(deployer);
    const sBtcToken = new SBtcToken(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 1000, deployer)).toBeOk(Cl.bool(true));

    let ststx = rewards.getCycleRewardsStStx(0);
    expect(tupleField(ststx, "total-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststx, "commission-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststx, "protocol-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststx, "processed-commission-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststx, "processed-protocol-stx")).toBeUint(uintWithDecimals(0).value);

    let ststxbtc = rewards.getCycleRewardsStStxBtc(0);
    expect(tupleField(ststxbtc, "total-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststxbtc, "commission-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststxbtc, "protocol-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststxbtc, "processed-commission-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststxbtc, "processed-protocol-sbtc")).toBeUint(uintWithDecimals(0).value);

    expect(
      dataPools.setPoolOwnerCommission(deployer, qualifiedName("stacking-pool-v1"), wallet_1, 0.1),
    ).toBeOk(Cl.bool(true));

    let poolOwner = dataPools.getPoolOwnerCommission(qualifiedName("stacking-pool-v1"));
    expect(tupleField(poolOwner, "receiver")).toBePrincipal(wallet_1);
    expect(tupleField(poolOwner, "share")).toBeUint(0.1 * 10000);

    expect(coreV1.getStxBalance(wallet_1)).toBeUint(uintWithDecimals(100000000).value);

    expect(rewards.addRewards(deployer, qualifiedName("stacking-pool-v1"), 100)).toBeOk(Cl.bool(true));
    expect(rewards.addRewardsSBtc(deployer, qualifiedName("stacking-pool-v1"), 10)).toBeOk(Cl.bool(true));

    // 100 STX rewards, 5% total commission = 5 STX
    // Pool owner gets 10%
    expect(coreV1.getStxBalance(wallet_1)).toBeUint(uintWithDecimals(100000000 + 0.5).value);

    // 10 sBTC rewards, 5% total commission = 0.5 sBTC
    // Pool owner gets 10%
    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(0.05));

    ststx = rewards.getCycleRewardsStStx(0);
    expect(tupleField(ststx, "total-stx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(ststx, "commission-stx")).toBeUint(uintWithDecimals(4.5).value);
    expect(tupleField(ststx, "protocol-stx")).toBeUint(uintWithDecimals(95).value);
    expect(tupleField(ststx, "processed-commission-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststx, "processed-protocol-stx")).toBeUint(uintWithDecimals(0).value);

    ststxbtc = rewards.getCycleRewardsStStxBtc(0);
    expect(tupleField(ststxbtc, "total-sbtc")).toBeUint(uintWithDecimals(10).value);
    expect(tupleField(ststxbtc, "commission-sbtc")).toBeUint(uintWithDecimals(0.45).value);
    expect(tupleField(ststxbtc, "protocol-sbtc")).toBeUint(uintWithDecimals(9.5).value);
    expect(tupleField(ststxbtc, "processed-commission-sbtc")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(ststxbtc, "processed-protocol-sbtc")).toBeUint(uintWithDecimals(0).value);
  });

  it("rewards-v4: get stx and sbtc", () => {
    const rewards = new Rewards(deployer);
    const sBtcToken = new SBtcToken(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));

    expect(rewards.addRewards(deployer, qualifiedName("stacking-pool-v1"), 100)).toBeOk(Cl.bool(true));

    expect(rewards.addRewardsSBtc(deployer, qualifiedName("stacking-pool-v1"), 10)).toBeOk(Cl.bool(true));

    expect(rewards.getStx(deployer, 100, deployer)).toBeOk(uintWithDecimals(100));

    expect(rewards.getSBtc(deployer, 10, deployer)).toBeOk(uintWithDecimals(10));
  });

  it("rewards-v4: set rewards interval length", () => {
    const rewards = new Rewards(deployer);

    expect(rewards.setRewardsIntervalLength(wallet_1, 3)).toBeErr(Cl.uint(20003));

    expect(rewards.setRewardsIntervalLength(deployer, 4)).toBeErr(Cl.uint(203005));

    expect(rewards.setRewardsIntervalLength(deployer, 3)).toBeOk(Cl.bool(true));

    expect(rewards.getRewardsIntervalLength()).toBeUint(3);
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("rewards-v4: can not add rewards with wrong commission contracts", () => {
    const rewards = new Rewards(deployer);
    const sBtcToken = new SBtcToken(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 1000, deployer)).toBeOk(Cl.bool(true));

    // Add rewards
    expect(rewards.addRewards(deployer, qualifiedName("stacking-pool-v1"), 100)).toBeOk(Cl.bool(true));
    expect(rewards.addRewardsSBtc(deployer, qualifiedName("stacking-pool-v1"), 100)).toBeOk(Cl.bool(true));

    // Go to end of cycle
    mineEmptyBlockUntil(19);

    // Check commission contracts
    expect(rewards.getStStxCommissionContract()).toBePrincipal(qualifiedName("commission-v2"));
    expect(rewards.getStStxBtcCommissionContract()).toBePrincipal(qualifiedName("commission-btc-v1"));

    // Can not add rewards if contracts are wrong
    let r = simnet.callPublicFn(
      "rewards-v5",
      "process-rewards",
      [
        Cl.uint(0),
        Cl.principal(qualifiedName("commission-btc-v1")),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.principal(qualifiedName("reserve-v1")),
      ],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(203003));

    // Switch commission contracts
    expect(rewards.setStStxCommissionContract(deployer, qualifiedName("commission-btc-v1"))).toBeOk(Cl.bool(true));
    expect(rewards.setStStxBtcCommissionContract(deployer, qualifiedName("commission-v2"))).toBeOk(Cl.bool(true));

    expect(rewards.getStStxCommissionContract()).toBePrincipal(qualifiedName("commission-btc-v1"));
    expect(rewards.getStStxBtcCommissionContract()).toBePrincipal(qualifiedName("commission-v2"));

    // Can get rewards
    r = simnet.callPublicFn(
      "rewards-v5",
      "process-rewards",
      [
        Cl.uint(0),
        Cl.principal(qualifiedName("commission-btc-v1")),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.principal(qualifiedName("reserve-v1")),
      ],
      deployer,
    ).result;
    expect(r).toHaveClarityType(ClarityType.ResponseOk);
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("rewards-v4: only protocol can get stx and sbtc", () => {
    const rewards = new Rewards(deployer);

    expect(rewards.getStx(wallet_1, 200, wallet_1)).toBeErr(Cl.uint(20003));

    expect(rewards.getSBtc(wallet_1, 200, wallet_1)).toBeErr(Cl.uint(20003));
  });

  it("rewards-v4: only protocol can set commission contracts", () => {
    const rewards = new Rewards(deployer);

    expect(rewards.setStStxCommissionContract(wallet_1, wallet_1)).toBeErr(Cl.uint(20003));

    expect(rewards.setStStxBtcCommissionContract(wallet_1, wallet_1)).toBeErr(Cl.uint(20003));
  });
});
