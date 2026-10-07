import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { qualifiedName, someValue, tupleField, uintWithDecimals } from "../wrappers/tests-utils";
import { DataDirectStacking } from "../wrappers/data-direct-stacking-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Protocol
//-------------------------------------

describe("data-direct-stacking", () => {
  it("data-direct-stacking: protocol can update direct stacking dependence", () => {
    const dataDirectStacking = new DataDirectStacking(deployer);

    expect(dataDirectStacking.getDirectStackingDependence()).toBeUint(2000);

    expect(dataDirectStacking.setDirectStackingDependence(deployer, 3000)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getDirectStackingDependence()).toBeUint(3000);
  });

  it("data-direct-stacking: protocol can update total direct stacking", () => {
    const dataDirectStacking = new DataDirectStacking(deployer);

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(0).value);

    expect(dataDirectStacking.setTotalDirectStacking(deployer, 500)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(500).value);
  });

  it("data-direct-stacking: protocol can update total direct stacking for pool", () => {
    const dataDirectStacking = new DataDirectStacking(deployer);

    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(0).value);

    expect(
      dataDirectStacking.setDirectStackingPoolAmount(deployer, qualifiedName("stacking-pool-v1"), 500),
    ).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(500).value);
  });

  it("data-direct-stacking: protocol can update total direct stacking for user", () => {
    const dataDirectStacking = new DataDirectStacking(deployer);

    expect(dataDirectStacking.getDirectStackingUser(wallet_1)).toBeNone();

    expect(
      dataDirectStacking.setDirectStackingUser(deployer, wallet_1, qualifiedName("stacking-pool-v1"), 500),
    ).toBeOk(Cl.bool(true));

    const user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(500).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("stacking-pool-v1"));
  });

  it("data-direct-stacking: protocol can delete direct stacking for user", () => {
    const dataDirectStacking = new DataDirectStacking(deployer);

    expect(
      dataDirectStacking.setDirectStackingUser(deployer, wallet_1, qualifiedName("stacking-pool-v1"), 500),
    ).toBeOk(Cl.bool(true));

    const user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(500).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("stacking-pool-v1"));

    expect(dataDirectStacking.deleteDirectStackingUser(deployer, wallet_1)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getDirectStackingUser(wallet_1)).toBeNone();
  });

  it("data-direct-stacking: protocol can set supported protocols", () => {
    const dataDirectStacking = new DataDirectStacking(deployer);

    expect(dataDirectStacking.getSupportedProtocols()).toBeList([
      Cl.principal(qualifiedName("protocol-arkadiko-mock")),
    ]);

    expect(
      dataDirectStacking.setSupportedProtocols(deployer, [qualifiedName("new-protocol"), qualifiedName("protocol-arkadiko-v1")]),
    ).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getSupportedProtocols()).toBeList([
      Cl.principal(qualifiedName("new-protocol")),
      Cl.principal(qualifiedName("protocol-arkadiko-v1")),
    ]);
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("data-direct-stacking: only protocol can use setters", () => {
    const dataDirectStacking = new DataDirectStacking(deployer);

    expect(dataDirectStacking.setDirectStackingDependence(wallet_1, 3000)).toBeErr(Cl.uint(20003));

    expect(dataDirectStacking.setTotalDirectStacking(wallet_1, 500)).toBeErr(Cl.uint(20003));

    expect(
      dataDirectStacking.setDirectStackingPoolAmount(wallet_1, qualifiedName("stacking-pool-v1"), 500),
    ).toBeErr(Cl.uint(20003));

    expect(
      dataDirectStacking.setDirectStackingUser(wallet_1, wallet_1, qualifiedName("stacking-pool-v1"), 500),
    ).toBeErr(Cl.uint(20003));

    expect(dataDirectStacking.deleteDirectStackingUser(wallet_1, wallet_1)).toBeErr(Cl.uint(20003));

    expect(
      dataDirectStacking.setSupportedProtocols(wallet_1, [qualifiedName("new-protocol"), qualifiedName("protocol-arkadiko-v1")]),
    ).toBeErr(Cl.uint(20003));
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("data-direct-stacking: direct stacking dependence max is 100%", () => {
    const dataDirectStacking = new DataDirectStacking(deployer);

    expect(dataDirectStacking.setDirectStackingDependence(deployer, 10000 + 1)).toBeErr(Cl.uint(243001));
  });
});
