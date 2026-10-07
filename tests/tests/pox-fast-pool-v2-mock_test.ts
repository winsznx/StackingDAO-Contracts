import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import {
  mineEmptyBlockUntil,
  okValue,
  qualifiedName,
  tupleField,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { FastPoolV2 } from "../wrappers/pox-fast-pool-v2-helpers";
import { StackingPool } from "../wrappers/stacking-pool-helpers";
import { Pox4Mock } from "../wrappers/pox-mock-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;

//-------------------------------------
// Core
//-------------------------------------

describe("fast-pool-v2", () => {
  it("fast-pool-v2: ", () => {
    const fastPool = new FastPoolV2(deployer);
    const stackingPool = new StackingPool(deployer);
    const pox = new Pox4Mock(deployer);
    stackingPool.addSignatures(deployer);

    // Need to allow the pool to manage our stacking
    // Because delegating & locking is done for the user by the contract
    expect(pox.allowContractCaller(deployer, qualifiedName("pox-fast-pool-v2-mock"))).toBeOk(Cl.bool(true));
    expect(pox.allowContractCaller(wallet_1, qualifiedName("pox-fast-pool-v2-mock"))).toBeOk(Cl.bool(true));
    expect(pox.allowContractCaller(wallet_2, qualifiedName("pox-fast-pool-v2-mock"))).toBeOk(Cl.bool(true));

    //
    // Move to cycle 1
    //
    mineEmptyBlockUntil(22);

    pox.getPoxInfo();

    // Commit failed as minimum not reached
    // TODO: Keeps 1 STX. Why?
    // Currently in cycle 1, so next cycle starts at block 42 and end ad block 63
    const inner = okValue(fastPool.delegateStx(deployer, 1000));
    expect(tupleField(inner, "commit-result")).toBeBool(false);
    const lock = tupleField(inner, "lock-result");
    expect(tupleField(lock, "lock-amount")).toBeUint(uintWithDecimals(1000 - 1).value);
    expect(tupleField(lock, "stacker")).toBePrincipal(deployer);
    expect(tupleField(lock, "unlock-burn-height")).toBeUint(63);
  });
});
