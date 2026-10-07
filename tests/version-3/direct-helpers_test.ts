import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import {
  okValue,
  qualifiedName,
  someValue,
  tupleField,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { DirectHelpers } from "../wrappers/direct-helpers-helpers";
import { DataDirectStacking } from "../wrappers/data-direct-stacking-helpers";
import { DataCore } from "../wrappers/data-core-helpers";
import { StStxToken } from "../wrappers/ststx-token-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;

//-------------------------------------
// Core
//-------------------------------------

describe("direct-helpers", () => {
  it("direct-helpers: add and subtract direct stacking", () => {
    const dataDirectStacking = new DataDirectStacking(deployer);
    const directHelpers = new DirectHelpers(deployer);

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingUser(wallet_1)).toBeNone();

    // Add to direct stacking with pool
    expect(directHelpers.addDirectStacking(deployer, wallet_1, qualifiedName("stacking-pool-v1"), 100)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(100).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(100).value);
    let user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("stacking-pool-v1"));

    // Subtract from direct stacking
    expect(directHelpers.subtractDirectStacking(deployer, wallet_1, 20)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(100 - 20).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(100 - 20).value);
    user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(100 - 20).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("stacking-pool-v1"));

    // Subtract from direct stacking, more than total
    // So direct stacking for user will be stopped
    expect(directHelpers.subtractDirectStacking(deployer, wallet_1, 90)).toBeOk(Cl.bool(true));
    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingUser(wallet_1)).toBeNone();
  });

  it("direct-helpers: add direct stacking multiple times", () => {
    const dataDirectStacking = new DataDirectStacking(deployer);
    const directHelpers = new DirectHelpers(deployer);

    //
    // No pool, so no direct stacking
    //

    expect(directHelpers.addDirectStacking(deployer, wallet_1, undefined, 100)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("pox-fast-pool-v2-mock"))).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingUser(wallet_1)).toBeNone();

    //
    // Still no pool, so no direct stacking
    //

    expect(directHelpers.addDirectStacking(deployer, wallet_1, undefined, 200)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("pox-fast-pool-v2-mock"))).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingUser(wallet_1)).toBeNone();

    //
    // Direct stack
    //

    expect(directHelpers.addDirectStacking(deployer, wallet_1, qualifiedName("stacking-pool-v1"), 500)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(500).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(500).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("pox-fast-pool-v2-mock"))).toBeUint(uintWithDecimals(0).value);
    let user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(500).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("stacking-pool-v1"));

    //
    // Direct stack - Different pool
    //

    expect(directHelpers.addDirectStacking(deployer, wallet_1, qualifiedName("pox-fast-pool-v2-mock"), 100)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(600).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("pox-fast-pool-v2-mock"))).toBeUint(uintWithDecimals(600).value);
    user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(600).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("pox-fast-pool-v2-mock"));

    //
    // Direct stack - Same pool
    //

    expect(directHelpers.addDirectStacking(deployer, wallet_1, qualifiedName("pox-fast-pool-v2-mock"), 50)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(650).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("pox-fast-pool-v2-mock"))).toBeUint(uintWithDecimals(650).value);
    user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(650).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("pox-fast-pool-v2-mock"));

    //
    // Normal stacking, stops direct stacking
    //

    expect(directHelpers.addDirectStacking(deployer, wallet_1, undefined, 50)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("pox-fast-pool-v2-mock"))).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingUser(wallet_1)).toBeNone();

    expect(directHelpers.stopDirectStackingUser(wallet_1)).toBeOk(Cl.bool(true));
  });

  //-------------------------------------
  // Core - User
  //-------------------------------------

  it("direct-helpers: user can subtract direct stacking and stop", () => {
    const dataDirectStacking = new DataDirectStacking(deployer);
    const directHelpers = new DirectHelpers(deployer);

    //
    // Direct stack
    //

    expect(directHelpers.addDirectStacking(deployer, wallet_1, qualifiedName("stacking-pool-v1"), 500)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(500).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(500).value);
    let user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(500).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("stacking-pool-v1"));

    //
    // Subtract
    //

    expect(directHelpers.subtractDirectStackingUser(wallet_1, 100)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(400).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(400).value);
    user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(400).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("stacking-pool-v1"));

    //
    // Stop
    //

    expect(directHelpers.stopDirectStackingUser(wallet_1)).toBeOk(Cl.bool(true));

    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(0).value);
    expect(dataDirectStacking.getDirectStackingUser(wallet_1)).toBeNone();
  });

  //-------------------------------------
  // Core - Supported protocols
  //-------------------------------------

  it("direct-helpers: stSTX moved to unsupported protocol, subtract direct stacking", () => {
    const directHelpers = new DirectHelpers(deployer);
    const stStxToken = new StStxToken(deployer);

    // Setup: 100 stSTX for wallet_1, 100 STX to reserve
    expect(stStxToken.mintForProtocol(deployer, 100, wallet_1)).toBeOk(Cl.bool(true));
    expect(simnet.transferSTX(100 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    let call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(call, "direct-stacking-ststx")).toBeUint(uintWithDecimals(0).value);

    // Add direct stacking
    expect(directHelpers.addDirectStacking(deployer, wallet_1, qualifiedName("stacking-pool-v1"), 100)).toBeOk(Cl.bool(true));

    call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(call, "direct-stacking-ststx")).toBeUint(uintWithDecimals(100).value);

    // Transfer stSTX
    expect(stStxToken.transfer(wallet_1, 20, wallet_2)).toBeOk(Cl.bool(true));

    call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(100 - 20).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(call, "direct-stacking-ststx")).toBeUint(uintWithDecimals(100).value);

    // Update direct stacking
    expect(directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1)).toBeOk(Cl.bool(true));

    call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(100 - 20).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(100 - 20).value);
    expect(tupleField(call, "direct-stacking-ststx")).toBeUint(uintWithDecimals(100 - 20).value);

    // Update direct stacking
    expect(directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1)).toBeOk(Cl.bool(true));

    call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(100 - 20).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(100 - 20).value);
    expect(tupleField(call, "direct-stacking-ststx")).toBeUint(uintWithDecimals(100 - 20).value);

    // Transfer all stSTX
    expect(stStxToken.transfer(wallet_1, 80, wallet_2)).toBeOk(Cl.bool(true));

    // Update direct stacking
    expect(directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1)).toBeOk(Cl.bool(true));

    call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(call, "direct-stacking-ststx")).toBeUint(uintWithDecimals(0).value);
  });

  it("direct-helpers: stSTX moved to unsupported protocol, but still have enough STX so do not subtract direct stacking", () => {
    const directHelpers = new DirectHelpers(deployer);
    const stStxToken = new StStxToken(deployer);

    // Setup: 200 stSTX for wallet_1, 200 STX to reserve
    expect(stStxToken.mintForProtocol(deployer, 200, wallet_1)).toBeOk(Cl.bool(true));
    expect(simnet.transferSTX(200 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    let call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(0).value);

    // Add direct stacking
    expect(directHelpers.addDirectStacking(deployer, wallet_1, qualifiedName("stacking-pool-v1"), 100)).toBeOk(Cl.bool(true));

    call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(200).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(100).value);

    // Transfer stSTX
    expect(stStxToken.transfer(wallet_1, 20, wallet_2)).toBeOk(Cl.bool(true));

    call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(200 - 20).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(100).value);

    // Update direct stacking
    expect(directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1)).toBeOk(Cl.bool(true));

    call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(200 - 20).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(100).value);
  });

  it("direct-helpers: stSTX moved to supported protocol", () => {
    const directHelpers = new DirectHelpers(deployer);
    const stStxToken = new StStxToken(deployer);

    // Setup: 100 stSTX for wallet_1, 100 STX to reserve
    expect(stStxToken.mintForProtocol(deployer, 100, wallet_1)).toBeOk(Cl.bool(true));
    expect(simnet.transferSTX(100 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    let call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(0).value);

    // Add direct stacking
    expect(directHelpers.addDirectStacking(deployer, wallet_1, qualifiedName("stacking-pool-v1"), 100)).toBeOk(Cl.bool(true));

    call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(100).value);

    // Transfer stSTX to supported protocol
    expect(
      simnet.callPublicFn(
        "protocol-arkadiko-mock",
        "add-user-balance",
        [Cl.uint(20 * 1_000_000)],
        wallet_1,
      ).result,
    ).toBeOk(Cl.bool(true));

    call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(100).value);

    // Update direct stacking
    expect(directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1)).toBeOk(Cl.bool(true));

    call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(100).value);

    // Transfer stSTX from supported protocol
    expect(
      simnet.callPublicFn(
        "protocol-arkadiko-mock",
        "remove-user-balance",
        [Cl.uint(10 * 1_000_000)],
        wallet_1,
      ).result,
    ).toBeOk(Cl.bool(true));

    // Update direct stacking
    expect(directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1)).toBeOk(Cl.bool(true));

    call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(100).value);
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("direct-helpers: can not update direct stacking with wrong reserve", () => {
    const { result } = simnet.callPublicFn(
      "direct-helpers-v4",
      "update-direct-stacking",
      [
        Cl.principal(qualifiedName("fake-reserve")),
        Cl.list([qualifiedName("protocol-arkadiko-mock")].map((protocol) => Cl.principal(protocol))),
        Cl.principal(wallet_1),
      ],
      deployer,
    );
    expect(result).toBeErr(Cl.uint(20003));
  });

  it("direct-helpers: can not update direct stacking with wrong protocols", () => {
    const directHelpers = new DirectHelpers(deployer);

    expect(directHelpers.updateDirectStacking(wallet_2, [qualifiedName("fake-protocol")], wallet_1)).toBeErr(Cl.uint(202001));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("direct-helpers: only protocol can add, subtract or stop direct stacking", () => {
    const directHelpers = new DirectHelpers(deployer);

    expect(directHelpers.addDirectStacking(wallet_1, wallet_2, qualifiedName("stacking-pool-v1"), 100)).toBeErr(Cl.uint(20003));

    expect(directHelpers.subtractDirectStacking(wallet_1, wallet_2, 20)).toBeErr(Cl.uint(20003));

    expect(directHelpers.stopDirectStacking(wallet_1, wallet_2)).toBeErr(Cl.uint(20003));
  });

  //-------------------------------------
  // Audit Fix
  //-------------------------------------

  it("direct-helpers: add and subtract direct stacking", () => {
    const dataDirectStacking = new DataDirectStacking(deployer);
    const directHelpers = new DirectHelpers(deployer);
    const stStxToken = new StStxToken(deployer);
    const dataCore = new DataCore(deployer);

    // Setup: 100 stSTX for wallet_1, 100 STX to reserve
    expect(stStxToken.mintForProtocol(deployer, 100, wallet_1)).toBeOk(Cl.bool(true));
    expect(simnet.transferSTX(100 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    // Add to direct stacking with pool
    expect(directHelpers.addDirectStacking(deployer, wallet_1, qualifiedName("stacking-pool-v1"), 100)).toBeOk(Cl.bool(true));

    // Direct stacking updated
    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(100).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(100).value);
    let user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("stacking-pool-v1"));

    // Change stSTX/STX ratio
    expect(simnet.transferSTX(100 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(dataCore.getStxPerStStx(qualifiedName("reserve-v1"))).toBeOk(uintWithDecimals(2));

    // Transfer stSTX
    expect(stStxToken.transfer(wallet_1, 20, wallet_2)).toBeOk(Cl.bool(true));

    // Update direct stacking
    let call = okValue(directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1));
    expect(tupleField(call, "balance-stx")).toBeUint(uintWithDecimals(160).value);
    expect(tupleField(call, "balance-ststx")).toBeUint(uintWithDecimals(80).value);
    expect(tupleField(call, "direct-stacking-stx")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(call, "direct-stacking-ststx")).toBeUint(uintWithDecimals(50).value);

    // Update direct stacking
    expect(directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1)).toBeOk(Cl.bool(true));

    // Direct stacking updated
    expect(dataDirectStacking.getTotalDirectStacking()).toBeUint(uintWithDecimals(100).value);
    expect(dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))).toBeUint(uintWithDecimals(100).value);
    user = someValue(dataDirectStacking.getDirectStackingUser(wallet_1));
    expect(tupleField(user, "amount")).toBeUint(uintWithDecimals(100).value);
    expect(tupleField(user, "pool")).toBePrincipal(qualifiedName("stacking-pool-v1"));
  });

  it("direct-helpers: protocols validation", () => {
    const directHelpers = new DirectHelpers(deployer);
    const dataDirectStacking = new DataDirectStacking(deployer);

    expect(
      dataDirectStacking.setSupportedProtocols(deployer, [
        qualifiedName("protocol-zest-mock"),
        qualifiedName("protocol-arkadiko-mock"),
      ]),
    ).toBeOk(Cl.bool(true));

    expect(
      directHelpers.updateDirectStacking(
        wallet_2,
        [qualifiedName("protocol-zest-mock"), qualifiedName("protocol-arkadiko-mock")],
        wallet_1,
      ),
    ).toBeOk(Cl.bool(true));

    // Wrong order
    expect(
      directHelpers.updateDirectStacking(
        wallet_2,
        [qualifiedName("protocol-arkadiko-mock"), qualifiedName("protocol-zest-mock")],
        wallet_1,
      ),
    ).toBeErr(Cl.uint(202001));

    // Duplicates
    expect(
      directHelpers.updateDirectStacking(
        wallet_2,
        [qualifiedName("protocol-zest-mock"), qualifiedName("protocol-zest-mock")],
        wallet_1,
      ),
    ).toBeErr(Cl.uint(202001));

    // Missing protocol
    expect(
      directHelpers.updateDirectStacking(
        wallet_2,
        [qualifiedName("protocol-zest-mock")],
        wallet_1,
      ),
    ).toBeErr(Cl.uint(202001));
  });
});
