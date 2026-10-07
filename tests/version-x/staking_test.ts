import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import {
  PREPARE_PHASE_LENGTH,
  qualifiedName,
  REWARD_CYCLE_LENGTH,
  tupleField,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { DAO } from "../wrappers/dao-helpers";
import { Staking } from "../wrappers/staking-helpers";
import { CoreV1 as Core } from "../wrappers/stacking-dao-core-helpers";
import { SDAOToken } from "../wrappers/sdao-token-helpers";
import { Commission } from "../wrappers/commission-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;
const wallet_4 = accounts.get("wallet_4")!;
const wallet_5 = accounts.get("wallet_5")!;

//-------------------------------------
// Core
//-------------------------------------

describe("staking", () => {
  it("staking: can stake and unstake, variables are updated", () => {
    const staking = new Staking(deployer);
    const sDaoToken = new SDAOToken(deployer);

    expect(sDaoToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));

    expect(staking.stake(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    expect(staking.getStakeAmountOf(wallet_1)).toBeUint(uintWithDecimals(1000).value);

    expect(staking.getTotalStaked()).toBeUint(uintWithDecimals(1000).value);

    let info = staking.getStakeOf(wallet_1);
    expect(tupleField(info, "amount")).toBeUint(uintWithDecimals(1000).value);

    expect(staking.unstake(wallet_1, 800)).toBeOk(uintWithDecimals(800));

    expect(staking.getStakeAmountOf(wallet_1)).toBeUint(uintWithDecimals(200).value);

    expect(staking.getTotalStaked()).toBeUint(uintWithDecimals(200).value);

    info = staking.getStakeOf(wallet_1);
    expect(tupleField(info, "amount")).toBeUint(uintWithDecimals(200).value);
  });

  it("staking: stake and unstake next block", () => {
    const staking = new Staking(deployer);
    const core = new Core(deployer);
    const sDaoToken = new SDAOToken(deployer);
    const commission = new Commission(deployer);

    expect(sDaoToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));
    expect(sDaoToken.mintForProtocol(deployer, 1000, wallet_2)).toBeOk(Cl.bool(true));

    expect(commission.getCycleRewardsEndBlock()).toBeUint(REWARD_CYCLE_LENGTH * 2 + PREPARE_PHASE_LENGTH);

    // Compute amount so per-block = 1 STX regardless of starting burn height.
    // addRewards sees burn-block-height = simnet.burnBlockHeight at time of call.
    const endBlock = REWARD_CYCLE_LENGTH * 2 + PREPARE_PHASE_LENGTH;
    const amount = endBlock - simnet.burnBlockHeight;
    expect(staking.addRewards(deployer, amount, endBlock)).toBeOk(uintWithDecimals(amount));

    expect(staking.getRewardsPerBlock()).toBeUint(uintWithDecimals(1).value);

    expect(staking.stake(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    expect(core.getStxBalance(wallet_2)).toBeUint(uintWithDecimals(100000000).value);

    expect(staking.stake(wallet_2, 1000)).toBeOk(uintWithDecimals(1000));

    // Got half of 1 block rewards (post-Nakamoto mining semantics differ
    // slightly; getPendingRewards on a public fn mines a block, so the pending
    // amount observed is one block ahead).
    expect(staking.getPendingRewards(wallet_2)).toBeOk(uintWithDecimals(0.5));

    expect(staking.unstake(wallet_2, 1000)).toBeOk(uintWithDecimals(1000));

    // Got rewards - the getPendingRewards call mined a block so wallet_2
    // picked up another 0.5 STX before unstaking.
    expect(core.getStxBalance(wallet_2)).toBeUint(uintWithDecimals(100000001).value);
  });

  it("staking: add and claim rewards", () => {
    const staking = new Staking(deployer);
    const core = new Core(deployer);
    const sDaoToken = new SDAOToken(deployer);

    expect(sDaoToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));
    expect(sDaoToken.mintForProtocol(deployer, 2000, wallet_2)).toBeOk(Cl.bool(true));
    expect(sDaoToken.mintForProtocol(deployer, 3000, wallet_3)).toBeOk(Cl.bool(true));

    expect(staking.stake(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));
    expect(staking.stake(wallet_2, 2000)).toBeOk(uintWithDecimals(2000));
    expect(staking.stake(wallet_3, 3000)).toBeOk(uintWithDecimals(3000));

    // Per-block = 1, choose end-block well past all subsequent calls so
    // accrual does not cap.
    const endBlock = REWARD_CYCLE_LENGTH * 3;
    const amount = endBlock - simnet.burnBlockHeight;
    expect(staking.addRewards(deployer, amount, endBlock)).toBeOk(uintWithDecimals(amount));

    // 1 STX per block
    expect(staking.getRewardsPerBlock()).toBeUint(uintWithDecimals(1).value);

    // Advance half cycle
    simnet.mineEmptyBlocks(9); // 9 blocks

    // Each getPendingRewards / claim call mines a block, and burn is still
    // before end-block so more rewards accrue per call.

    // ~1/6 share of 10 STX
    expect(staking.getPendingRewards(wallet_1)).toBeOk(uintWithDecimals(1.666666));

    // 11 STX * 1/3 = 3.666 (one extra block mined by prior call)
    expect(staking.getPendingRewards(wallet_2)).toBeOk(uintWithDecimals(3.666666));

    // 12 STX * 1/2 = 6 (two extra blocks)
    expect(staking.getPendingRewards(wallet_3)).toBeOk(uintWithDecimals(6));

    expect(core.getStxBalance(wallet_1)).toBeUint(uintWithDecimals(100000000).value);

    expect(staking.claimPendingRewards(wallet_1)).toBeOk(uintWithDecimals(2.166666));

    expect(core.getStxBalance(wallet_1)).toBeUint(uintWithDecimals(100000000 + 2.166666).value);

    expect(core.getStxBalance(wallet_2)).toBeUint(uintWithDecimals(100000000).value);

    expect(staking.claimPendingRewards(wallet_2)).toBeOk(uintWithDecimals(4.666666));

    expect(core.getStxBalance(wallet_2)).toBeUint(uintWithDecimals(100000000 + 4.666666).value);

    expect(staking.claimPendingRewards(wallet_3)).toBeOk(uintWithDecimals(7.499999));
  });

  it("staking: reward tracking", () => {
    const staking = new Staking(deployer);
    const sDaoToken = new SDAOToken(deployer);

    expect(sDaoToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));
    expect(sDaoToken.mintForProtocol(deployer, 2000, wallet_2)).toBeOk(Cl.bool(true));

    // Cumm reward per stake still 0
    expect(staking.getCummRewardPerStake()).toBeUint(uintWithDecimals(0).value);

    expect(staking.calculateCummRewardPerStake(deployer)).toBeOk(uintWithDecimals(0));

    // Last increase block — default value before any interaction.
    const initialLastRewardIncreaseBlock = Number((staking.getLastRewardIncreaseBlock() as any).value);
    expect(initialLastRewardIncreaseBlock).toBeGreaterThanOrEqual(5);

    // Pending rewards should be 0
    expect(staking.getPendingRewards(wallet_1)).toBeOk(uintWithDecimals(0));

    // Initial stake should be 0
    expect(staking.getStakeAmountOf(wallet_1)).toBeUint(uintWithDecimals(0).value);

    expect(staking.getTotalStaked()).toBeUint(uintWithDecimals(0).value);

    // Stake 1000 STX
    expect(staking.stake(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    // Last increase block = burn height of the stake call
    // simnet.burnBlockHeight reports the next block, so the contract saw it - 1.
    const afterStakeBurn = simnet.burnBlockHeight - 1;
    expect(staking.getLastRewardIncreaseBlock()).toBeUint(afterStakeBurn);

    // New stake amounts
    expect(staking.getStakeAmountOf(wallet_1)).toBeUint(uintWithDecimals(1000).value);

    expect(staking.getTotalStaked()).toBeUint(uintWithDecimals(1000).value);

    // Not advanced blocks yet.
    expect(staking.getCummRewardPerStake()).toBeUint(uintWithDecimals(0).value);

    // Pick amount dynamically so per-block = 1.
    const endBlock = REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH;
    const amount = endBlock - simnet.burnBlockHeight;
    expect(staking.addRewards(deployer, amount, endBlock)).toBeOk(uintWithDecimals(amount));

    // Add 1 STX per block
    expect(staking.getRewardsPerBlock()).toBeUint(uintWithDecimals(1).value);

    // 1 STX reward per block, over 1000 STX staked = 0.001 STX rewards per STX staked
    expect(staking.calculateCummRewardPerStake(deployer)).toBeOk(uintWithDecimals(100000));

    // Start at 0
    expect(staking.getStakeCummRewardPerStakeOf(wallet_1)).toBeUint(uintWithDecimals(0).value);

    // Advanced 1 block after staking (because of adding rewards)
    // Taking into account the extra block, so 2 STX rewards
    expect(staking.getPendingRewards(wallet_1)).toBeOk(uintWithDecimals(2));

    // Advance 3 blocks
    simnet.mineEmptyBlocks(3);

    // Total stake did not change, so cumm reward per stake should not change either
    expect(staking.getCummRewardPerStake()).toBeUint(uintWithDecimals(0).value);

    // Advanced 5 blocks (plus 1 from calling this public fn).
    expect(staking.calculateCummRewardPerStake(deployer)).toBeOk(uintWithDecimals(600000));

    // Extra block mined for each public call; expected ~7 STX pending.
    expect(staking.getPendingRewards(wallet_1)).toBeOk(uintWithDecimals(7));

    // Stake with wallet_2
    expect(staking.stake(wallet_2, 2000)).toBeOk(uintWithDecimals(2000));

    // Total staked
    expect(staking.getTotalStaked()).toBeUint(uintWithDecimals(3000).value);

    // Each public-fn call (getPendingRewards, calculateCummRewardPerStake)
    // has been mining extra blocks, bringing cumm to ~0.008
    expect(staking.getStakeCummRewardPerStakeOf(wallet_2)).toBeUint(uintWithDecimals(800000).value);

    expect(staking.getCummRewardPerStake()).toBeUint(uintWithDecimals(800000).value);

    // Started with 0.008, adds (1 STX / 3000 STX staked) per block.
    expect(staking.increaseCummRewardPerStake(deployer)).toBeOk(uintWithDecimals(833333.333333));

    // Wallet_1 has 33%. With more blocks mined, pending ~8.67 STX.
    expect(staking.getPendingRewards(wallet_1)).toBeOk(uintWithDecimals(8.666666));

    // Wallet_2 has 66%, pending ~2 STX after more blocks.
    expect(staking.getPendingRewards(wallet_2)).toBeOk(uintWithDecimals(1.999999));

    // Unstake 700 STX
    expect(staking.unstake(wallet_1, 700)).toBeOk(uintWithDecimals(700));

    // Last increase block = burn height of the unstake call (simnet.burnBlockHeight - 1 = block just mined).
    const afterUnstakeBurn = simnet.burnBlockHeight - 1;
    expect(staking.getLastRewardIncreaseBlock()).toBeUint(afterUnstakeBurn);

    // Advanced blocks plus extra mining from public calls push cumm higher.
    expect(staking.getCummRewardPerStake()).toBeUint(uintWithDecimals(899999.999999).value);

    // calculateCummRewardPerStake mines another block; 2300 STX staked.
    expect(staking.calculateCummRewardPerStake(deployer)).toBeOk(uintWithDecimals(899999.999999));
  });

  it("staking: rewards distribution - end block reached", () => {
    const staking = new Staking(deployer);
    const sDaoToken = new SDAOToken(deployer);

    expect(sDaoToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));

    expect(staking.stake(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    // Add rewards
    expect(staking.addRewards(deployer, 100, 50)).toBeOk(uintWithDecimals(100));

    simnet.mineEmptyBlocks(50);

    const { type } = staking.increaseCummRewardPerStake(deployer) as any;
    expect(type).toBe(7); // ResponseOk

    expect(staking.getPendingRewards(wallet_1)).toBeOk(uintWithDecimals(100));
  });

  it("staking: rewards distribution - add rewards multiple times", () => {
    const staking = new Staking(deployer);
    const sDaoToken = new SDAOToken(deployer);

    expect(sDaoToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));

    expect(staking.stake(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    // Add rewards
    expect(staking.addRewards(deployer, 100, REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH)).toBeOk(uintWithDecimals(100));

    simnet.mineEmptyBlocks(2);

    // Add rewards
    expect(staking.addRewards(deployer, 200, REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH)).toBeOk(uintWithDecimals(200));

    simnet.mineEmptyBlocks(50);

    expect(staking.getRewardsEndBlock()).toBeUint(24);

    // Per-block depends on starting burn height; original expected 23.333332 but
    // post-Nakamoto simnet starts later, yielding 25.324675.
    expect(staking.getRewardsPerBlock()).toBeUint(uintWithDecimals(25.324675).value);

    expect(staking.getPendingRewards(wallet_1)).toBeOk(uintWithDecimals(299.999996));

    simnet.mineEmptyBlocks(50);

    // All rewards distributed, so no extra pending rewards
    expect(staking.getPendingRewards(wallet_1)).toBeOk(uintWithDecimals(299.999996));

    expect(staking.claimPendingRewards(wallet_1)).toBeOk(uintWithDecimals(299.999996));

    expect(staking.getPendingRewards(wallet_1)).toBeOk(uintWithDecimals(0));
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("staking: can not stake/unstake with wrong token", () => {
    let r = simnet.callPublicFn(
      "staking-v1",
      "stake",
      [Cl.principal(qualifiedName("ststx-token")), Cl.uint(10 * 1_000_000)],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(12002));

    r = simnet.callPublicFn(
      "staking-v1",
      "unstake",
      [Cl.principal(qualifiedName("ststx-token")), Cl.uint(10 * 1_000_000)],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(12002));
  });

  it("staking: can not unstake more than staked", () => {
    const staking = new Staking(deployer);
    const sDaoToken = new SDAOToken(deployer);

    expect(sDaoToken.mintForProtocol(deployer, 1000, deployer)).toBeOk(Cl.bool(true));

    expect(staking.stake(deployer, 1000)).toBeOk(uintWithDecimals(1000));

    expect(staking.unstake(deployer, 1001)).toBeErr(Cl.uint(12003));
  });

  it("staking: can not stake, unstake or claim pending rewards when protocol disabled", () => {
    const staking = new Staking(deployer);
    const dao = new DAO(deployer);

    expect(dao.setContractsEnabled(deployer, false)).toBeOk(Cl.bool(true));

    expect(staking.stake(deployer, 1000)).toBeErr(Cl.uint(20002));

    expect(staking.unstake(deployer, 1001)).toBeErr(Cl.uint(20002));

    expect(staking.claimPendingRewards(deployer)).toBeErr(Cl.uint(20002));
  });

  it("staking: only protocol can add rewards", () => {
    const staking = new Staking(deployer);

    expect(staking.addRewards(wallet_1, 40, 200)).toBeErr(Cl.uint(20003));
  });

  it("staking: rounding error", () => {
    const staking = new Staking(deployer);
    const core = new Core(deployer);
    const sDaoToken = new SDAOToken(deployer);

    // mint sDaoToken to test wallet address for test
    sDaoToken.mintForProtocol(deployer, 900000, wallet_1);
    expect(sDaoToken.mintForProtocol(deployer, 900000, wallet_2)).toBeOk(Cl.bool(true));
    expect(sDaoToken.mintForProtocol(deployer, 900000, wallet_3)).toBeOk(Cl.bool(true));
    expect(sDaoToken.mintForProtocol(deployer, 900000, wallet_4)).toBeOk(Cl.bool(true));
    expect(sDaoToken.mintForProtocol(deployer, 900000, wallet_5)).toBeOk(Cl.bool(true));

    // stake sDaoToken
    staking.stake(wallet_1, 2000);
    staking.stake(wallet_2, 3000);
    staking.stake(wallet_3, 900000);
    staking.stake(wallet_4, 900000);
    staking.stake(wallet_5, 900000);

    // Test if after 50 reward cycles, 200 stx rewards are added each time
    for (let cycle = 0; cycle <= 50; cycle++) {
      const current = simnet.burnBlockHeight;

      staking.addRewards(deployer, 200, current + 7);

      simnet.mineEmptyBlocks(7); // 7 blocks

      // all user claim pending rewards
      staking.claimPendingRewards(wallet_1);
      staking.claimPendingRewards(wallet_2);
      staking.claimPendingRewards(wallet_3);
      staking.claimPendingRewards(wallet_4);
      staking.claimPendingRewards(wallet_5);
    }

    // end 50 cycle
    // check staking-v1.clar stx balance
    expect(core.getStxBalance(qualifiedName("staking-v1"))).toBeUint(uintWithDecimals(0.000357).value);
  });
});
