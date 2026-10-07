import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { qualifiedName, uintWithDecimals } from "../wrappers/tests-utils";
import { CoreV1 as Core } from "../wrappers/stacking-dao-core-helpers";
import { ReturnStxJob } from "../wrappers/return-stx-job-helpers";
import { Reserve } from "../wrappers/reserve-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

//-------------------------------------
// Return STX Job
//-------------------------------------

describe("return-stx-job", () => {
  it("return-stx-job: run job", () => {
    const returnStxJob = new ReturnStxJob(deployer);
    const core = new Core(deployer);
    const reserve = new Reserve(deployer);

    // Transfer 200 STX to reserve
    expect(simnet.transferSTX(200 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    // Request 200 STX to stack
    // Needed so we can actually return in later in the test
    expect(reserve.requestStxToStack(deployer, 200)).toBeOk(uintWithDecimals(200));

    // 200 STX stacking
    expect(reserve.getStxStacking()).toBeOk(uintWithDecimals(200));

    // Stacker does not have STX
    expect(returnStxJob.checkJob()).toBeOk(Cl.bool(false));

    // Reserve has no STX left
    expect(core.getStxBalance(qualifiedName("reserve-v1"))).toBeUint(uintWithDecimals(0).value);

    // Transfer 10 STX to stacker-1
    expect(simnet.transferSTX(10 * 1_000_000, qualifiedName("stacker-1"), deployer).result).toBeOk(Cl.bool(true));

    // Stacker has STX, can return to reserve
    expect(returnStxJob.checkJob()).toBeOk(Cl.bool(true));

    // Run job to return STX to reserve
    expect(returnStxJob.runJob(deployer)).toBeOk(Cl.bool(true));

    // Should not run again
    expect(returnStxJob.checkJob()).toBeOk(Cl.bool(false));

    // 10 STX back in reserve
    expect(core.getStxBalance(qualifiedName("reserve-v1"))).toBeUint(uintWithDecimals(10).value);

    // 10 STX returned
    expect(reserve.getStxStacking()).toBeOk(uintWithDecimals(200 - 10));
  });
});
