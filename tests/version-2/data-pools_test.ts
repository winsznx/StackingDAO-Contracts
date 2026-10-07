import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { qualifiedName, tupleField } from "../wrappers/tests-utils";
import { DataPools } from "../wrappers/data-pools-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Protocol
//-------------------------------------

describe("data-pools", () => {
  it("data-pools: protocol can update standard commission", () => {
    const dataPools = new DataPools(deployer);

    expect(dataPools.getStandardCommission()).toBeUint(500);

    expect(dataPools.getPoolCommission(qualifiedName("some-pool"))).toBeUint(500);

    expect(dataPools.getPoolCommission(qualifiedName("stacking-pool-v1"))).toBeUint(500);

    expect(dataPools.setStandardCommission(deployer, 1000)).toBeOk(Cl.bool(true));

    expect(dataPools.getStandardCommission()).toBeUint(1000);

    expect(dataPools.getPoolCommission(qualifiedName("some-pool"))).toBeUint(1000);

    expect(dataPools.getPoolCommission(qualifiedName("stacking-pool-v1"))).toBeUint(500);
  });

  it("data-pools: protocol can update pool commission", () => {
    const dataPools = new DataPools(deployer);

    expect(dataPools.getPoolCommission(qualifiedName("stacking-pool-v1"))).toBeUint(500);

    expect(
      dataPools.setPoolCommission(deployer, qualifiedName("stacking-pool-v1"), 100),
    ).toBeOk(Cl.bool(true));

    expect(dataPools.getPoolCommission(qualifiedName("stacking-pool-v1"))).toBeUint(100);
  });

  it("data-pools: protocol can update pool owner commission", () => {
    const dataPools = new DataPools(deployer);

    let owner = dataPools.getPoolOwnerCommission(qualifiedName("stacking-pool-v1"));
    expect(tupleField(owner, "receiver")).toBePrincipal(qualifiedName("rewards-v1"));
    expect(tupleField(owner, "share")).toBeUint(0);

    expect(
      dataPools.setPoolOwnerCommission(deployer, qualifiedName("stacking-pool-v1"), wallet_1, 0.25),
    ).toBeOk(Cl.bool(true));

    owner = dataPools.getPoolOwnerCommission(qualifiedName("stacking-pool-v1"));
    expect(tupleField(owner, "receiver")).toBePrincipal(wallet_1);
    expect(tupleField(owner, "share")).toBeUint(0.25 * 10_000);
  });

  it("data-pools: protocol can update active pools list", () => {
    const dataPools = new DataPools(deployer);

    expect(dataPools.getActivePools()).toBeList([
      Cl.principal(qualifiedName("stacking-pool-v1")),
      Cl.principal(qualifiedName("pox-fast-pool-v2-mock")),
    ]);

    expect(
      dataPools.setActivePools(deployer, [qualifiedName("stacking-pool-v1"), qualifiedName("new-pool-v1")]),
    ).toBeOk(Cl.bool(true));

    expect(dataPools.getActivePools()).toBeList([
      Cl.principal(qualifiedName("stacking-pool-v1")),
      Cl.principal(qualifiedName("new-pool-v1")),
    ]);
  });

  it("data-pools: protocol can update pool share", () => {
    const dataPools = new DataPools(deployer);

    expect(dataPools.getPoolShare(qualifiedName("stacking-pool-v1"))).toBeUint(7000);

    expect(
      dataPools.setPoolShare(deployer, qualifiedName("stacking-pool-v1"), 9000),
    ).toBeOk(Cl.bool(true));

    expect(dataPools.getPoolShare(qualifiedName("stacking-pool-v1"))).toBeUint(9000);
  });

  it("data-pools: protocol can update pool delegates", () => {
    const dataPools = new DataPools(deployer);

    expect(dataPools.getPoolDelegates(qualifiedName("stacking-pool-v1"))).toBeList([
      Cl.principal(qualifiedName("stacking-delegate-1-1")),
      Cl.principal(qualifiedName("stacking-delegate-1-2")),
      Cl.principal(qualifiedName("stacking-delegate-1-3")),
    ]);

    expect(
      dataPools.setPoolDelegates(deployer, qualifiedName("stacking-pool-v1"), [qualifiedName("stacking-delegate-3-1"), qualifiedName("stacking-delegate-3-2")]),
    ).toBeOk(Cl.bool(true));

    expect(dataPools.getPoolDelegates(qualifiedName("stacking-pool-v1"))).toBeList([
      Cl.principal(qualifiedName("stacking-delegate-3-1")),
      Cl.principal(qualifiedName("stacking-delegate-3-2")),
    ]);
  });

  it("data-pools: protocol can update delegate share", () => {
    const dataPools = new DataPools(deployer);

    expect(dataPools.getDelegateShare(qualifiedName("stacking-delegate-1-1"))).toBeUint(5000);

    expect(
      dataPools.setDelegateShare(deployer, qualifiedName("stacking-delegate-1-1"), 4000),
    ).toBeOk(Cl.bool(true));

    expect(dataPools.getDelegateShare(qualifiedName("stacking-delegate-1-1"))).toBeUint(4000);
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("data-pools: can not set pool owner share above 100%", () => {
    const dataPools = new DataPools(deployer);

    expect(
      dataPools.setPoolOwnerCommission(deployer, qualifiedName("stacking-pool-v1"), wallet_1, 1.1),
    ).toBeErr(Cl.uint(2011001));
  });

  it("data-pools: can not set commission above 40%", () => {
    const dataPools = new DataPools(deployer);

    expect(dataPools.setStandardCommission(deployer, 4001)).toBeErr(Cl.uint(2011002));

    expect(
      dataPools.setPoolCommission(deployer, qualifiedName("stacking-pool-v1"), 4001),
    ).toBeErr(Cl.uint(2011002));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("data-pools: only protocol can use setters", () => {
    const dataPools = new DataPools(deployer);

    expect(dataPools.setStandardCommission(wallet_1, 1000)).toBeErr(Cl.uint(20003));

    expect(
      dataPools.setPoolCommission(wallet_1, qualifiedName("stacking-pool-v1"), 100),
    ).toBeErr(Cl.uint(20003));

    expect(
      dataPools.setPoolOwnerCommission(wallet_1, qualifiedName("stacking-pool-v1"), wallet_1, 0.25),
    ).toBeErr(Cl.uint(20003));

    expect(
      dataPools.setActivePools(wallet_1, [qualifiedName("stacking-pool-v1"), qualifiedName("new-pool-v1")]),
    ).toBeErr(Cl.uint(20003));

    expect(
      dataPools.setPoolShare(wallet_1, qualifiedName("stacking-pool-v1"), 9000),
    ).toBeErr(Cl.uint(20003));

    expect(
      dataPools.setPoolDelegates(wallet_1, qualifiedName("stacking-pool-v1"), [qualifiedName("stacking-delegate-3-1"), qualifiedName("stacking-delegate-3-2")]),
    ).toBeErr(Cl.uint(20003));

    expect(
      dataPools.setDelegateShare(wallet_1, qualifiedName("stacking-delegate-1-1"), 4000),
    ).toBeErr(Cl.uint(20003));
  });
});
