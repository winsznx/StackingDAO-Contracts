import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import {
  mineEmptyBlockUntil,
  qualifiedName,
  REWARD_CYCLE_LENGTH,
  tupleField,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { CoreV1 as Core } from "../wrappers/stacking-dao-core-helpers";
import { RewardsJob } from "../wrappers/rewards-job-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Rewards Job
//-------------------------------------

describe("rewards-job", () => {
  it("rewards-job: run job", () => {
    const rewardsJob = new RewardsJob(deployer);
    const core = new Core(deployer);

    expect(rewardsJob.checkJob()).toBeOk(Cl.bool(false));

    // Transfer 100 STX to contract
    expect(simnet.transferSTX(100 * 1_000_000, qualifiedName("rewards-job-v1"), deployer).result).toBeOk(Cl.bool(true));

    //
    // Advance to cycle 1
    //

    mineEmptyBlockUntil(REWARD_CYCLE_LENGTH + 1);

    //
    // At beginning of PoX cycle
    //
    expect(core.getPoxCycle()).toBeUint(1);

    expect(core.getNextWithdrawCycle()).toBeUint(2);

    expect(rewardsJob.checkJob()).toBeOk(Cl.bool(false));

    //
    // At end of PoX cycle
    //

    mineEmptyBlockUntil(REWARD_CYCLE_LENGTH + REWARD_CYCLE_LENGTH - 1);

    expect(core.getPoxCycle()).toBeUint(1);

    expect(core.getNextWithdrawCycle()).toBeUint(3);

    expect(rewardsJob.checkJob()).toBeOk(Cl.bool(true));

    //
    // Run job
    //

    expect(core.getStxBalance(qualifiedName("rewards-job-v1"))).toBeUint(uintWithDecimals(100).value);

    expect(core.getStxBalance(qualifiedName("reserve-v1"))).toBeUint(uintWithDecimals(0).value);

    expect(core.getStxBalance(qualifiedName("commission-v1"))).toBeUint(uintWithDecimals(0).value);

    let cycleInfo = core.getCycleInfo(0);
    expect(tupleField(cycleInfo, "commission")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(cycleInfo, "rewards")).toBeUint(uintWithDecimals(0).value);

    expect(rewardsJob.runJob(deployer)).toBeOk(Cl.bool(true));

    expect(core.getStxBalance(qualifiedName("rewards-job-v1"))).toBeUint(uintWithDecimals(0).value);

    expect(core.getStxBalance(qualifiedName("reserve-v1"))).toBeUint(uintWithDecimals(95).value);

    expect(core.getStxBalance(qualifiedName("commission-v1"))).toBeUint(uintWithDecimals(5).value);

    cycleInfo = core.getCycleInfo(1);
    expect(tupleField(cycleInfo, "commission")).toBeUint(uintWithDecimals(5).value);
    expect(tupleField(cycleInfo, "rewards")).toBeUint(uintWithDecimals(95).value);
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("rewards-job: protocol can retreive tokens", () => {
    const rewardsJob = new RewardsJob(deployer);
    const core = new Core(deployer);

    // Transfer 100 STX to contract
    expect(simnet.transferSTX(100 * 1_000_000, qualifiedName("rewards-job-v1"), deployer).result).toBeOk(Cl.bool(true));

    // Contract balances
    expect(core.getStxBalance(qualifiedName("rewards-job-v1"))).toBeUint(uintWithDecimals(100).value);

    // Retreive tokens
    expect(rewardsJob.retreiveStxTokens(deployer, 10, deployer)).toBeOk(uintWithDecimals(10));

    // Contract balances
    expect(core.getStxBalance(qualifiedName("rewards-job-v1"))).toBeUint(uintWithDecimals(90).value);
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("rewards-job: only protocol can retreive tokens", () => {
    const rewardsJob = new RewardsJob(deployer);

    expect(rewardsJob.retreiveStxTokens(wallet_1, 10, wallet_1)).toBeErr(Cl.uint(20003));
  });
});
