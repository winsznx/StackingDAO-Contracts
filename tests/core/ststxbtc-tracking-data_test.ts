import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { qualifiedName, someValue, tupleField, uintWithDecimals } from "../wrappers/tests-utils";
import { StStxBtcTrackingData } from "../wrappers/ststxbtc-tracking-data-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Getters / Setters
//-------------------------------------

describe("ststxbtc-tracking-data", () => {
  it("ststxbtc-tracking-data: can get/set total supply", () => {
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    expect(stStxBtcTrackingData.getTotalSupply()).toBeUint(0);

    expect(stStxBtcTrackingData.setTotalSupply(deployer, 1000)).toBeOk(Cl.bool(true));

    expect(stStxBtcTrackingData.getTotalSupply()).toBeUint(1000 * 1_000_000);
  });

  it("ststxbtc-tracking-data: can get/set holder index", () => {
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    expect(stStxBtcTrackingData.getNextHolderIndex()).toBeUint(0);

    expect(stStxBtcTrackingData.setNextHolderIndex(deployer, 1000)).toBeOk(Cl.bool(true));

    expect(stStxBtcTrackingData.getNextHolderIndex()).toBeUint(1000);
  });

  it("ststxbtc-tracking-data: can get/set cummulative rewards", () => {
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    expect(stStxBtcTrackingData.getCummRewards()).toBeUint(0);

    expect(stStxBtcTrackingData.setCummReward(deployer, 1000)).toBeOk(Cl.bool(true));

    expect(stStxBtcTrackingData.getCummRewards()).toBeUint(1000);
  });

  it("ststxbtc-tracking-data: can get/set supported position", () => {
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    let position = stStxBtcTrackingData.getSupportedPositions(deployer);
    expect(tupleField(position, "active")).toBeBool(false);

    expect(
      stStxBtcTrackingData.setSupportedPositions(
        deployer,
        deployer,
        true,
        qualifiedName("position-mock"),
        10,
        20,
      ),
    ).toBeOk(Cl.bool(true));

    position = stStxBtcTrackingData.getSupportedPositions(deployer);
    expect(tupleField(position, "active")).toBeBool(true);
    expect(tupleField(position, "total")).toBeUint(uintWithDecimals(10).value);
    expect(tupleField(position, "deactivated-cumm-reward")).toBeUint(20);
    expect(tupleField(position, "reserve")).toBePrincipal(qualifiedName("position-mock"));
  });

  it("ststxbtc-tracking-data: can get/set holder index to address", () => {
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    expect(stStxBtcTrackingData.getHoldersIndexToAddress(100)).toBeNone();

    expect(
      stStxBtcTrackingData.setHoldersIndexToAddress(deployer, 1000, deployer),
    ).toBeOk(Cl.bool(true));

    expect(someValue(stStxBtcTrackingData.getHoldersIndexToAddress(1000))).toBePrincipal(deployer);
  });

  it("ststxbtc-tracking-data: can get/set holder address to index", () => {
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    expect(stStxBtcTrackingData.getHoldersAddressToIndex(deployer)).toBeNone();

    expect(
      stStxBtcTrackingData.setHoldersAddressToIndex(deployer, deployer, 1000),
    ).toBeOk(Cl.bool(true));

    expect(someValue(stStxBtcTrackingData.getHoldersAddressToIndex(deployer))).toBeUint(1000);
  });

  it("ststxbtc-tracking-data: can get/set holder position", () => {
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    let position = stStxBtcTrackingData.getHolderPosition(deployer, deployer);
    expect(tupleField(position, "amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(position, "cumm-reward")).toBeUint(0);

    expect(
      stStxBtcTrackingData.setHolderPosition(deployer, deployer, deployer, 1000, 10),
    ).toBeOk(Cl.bool(true));

    position = stStxBtcTrackingData.getHolderPosition(deployer, deployer);
    expect(tupleField(position, "amount")).toBeUint(uintWithDecimals(1000).value);
    expect(tupleField(position, "cumm-reward")).toBeUint(10);
  });

  //-------------------------------------
  // Helpers
  //-------------------------------------

  it("ststxbtc-tracking-data: add holder", () => {
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    // Data
    let position = stStxBtcTrackingData.getHolderPosition(deployer, deployer);
    expect(tupleField(position, "amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(position, "cumm-reward")).toBeUint(0);

    expect(stStxBtcTrackingData.getHoldersAddressToIndex(deployer)).toBeNone();

    expect(stStxBtcTrackingData.getHoldersIndexToAddress(0)).toBeNone();

    expect(stStxBtcTrackingData.getNextHolderIndex()).toBeUint(0);

    // Add
    expect(stStxBtcTrackingData.addHolder(deployer, deployer)).toBeOk(Cl.bool(true));

    // Data
    position = stStxBtcTrackingData.getHolderPosition(deployer, deployer);
    expect(tupleField(position, "amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(position, "cumm-reward")).toBeUint(0);

    expect(someValue(stStxBtcTrackingData.getHoldersAddressToIndex(deployer))).toBeUint(0);

    expect(someValue(stStxBtcTrackingData.getHoldersIndexToAddress(0))).toBePrincipal(deployer);

    expect(stStxBtcTrackingData.getNextHolderIndex()).toBeUint(1);
  });

  it("ststxbtc-tracking-data: update holder position", () => {
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    // Data
    let position = stStxBtcTrackingData.getHolderPosition(deployer, qualifiedName("position-mock"));
    expect(tupleField(position, "amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(position, "cumm-reward")).toBeUint(0);

    expect(stStxBtcTrackingData.getHoldersAddressToIndex(deployer)).toBeNone();

    expect(stStxBtcTrackingData.getHoldersIndexToAddress(0)).toBeNone();

    expect(stStxBtcTrackingData.getNextHolderIndex()).toBeUint(0);

    // Update
    expect(
      stStxBtcTrackingData.updateHolderPosition(deployer, deployer, qualifiedName("position-mock")),
    ).toBeOk(Cl.bool(true));

    // Data
    position = stStxBtcTrackingData.getHolderPosition(deployer, qualifiedName("position-mock"));
    expect(tupleField(position, "amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(position, "cumm-reward")).toBeUint(0);

    expect(someValue(stStxBtcTrackingData.getHoldersAddressToIndex(deployer))).toBeUint(0);

    expect(someValue(stStxBtcTrackingData.getHoldersIndexToAddress(0))).toBePrincipal(deployer);

    expect(stStxBtcTrackingData.getNextHolderIndex()).toBeUint(1);
  });

  it("ststxbtc-tracking-data: update holder position amount", () => {
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    // Data
    let position = stStxBtcTrackingData.getHolderPosition(deployer, qualifiedName("position-mock"));
    expect(tupleField(position, "amount")).toBeUint(uintWithDecimals(0).value);
    expect(tupleField(position, "cumm-reward")).toBeUint(0);

    expect(stStxBtcTrackingData.getHoldersAddressToIndex(deployer)).toBeNone();

    expect(stStxBtcTrackingData.getHoldersIndexToAddress(0)).toBeNone();

    expect(stStxBtcTrackingData.getNextHolderIndex()).toBeUint(0);

    // Update
    expect(
      stStxBtcTrackingData.updateHolderPositionAmount(
        deployer,
        deployer,
        qualifiedName("position-mock"),
        1000,
      ),
    ).toBeOk(Cl.bool(true));

    // Data
    position = stStxBtcTrackingData.getHolderPosition(deployer, qualifiedName("position-mock"));
    expect(tupleField(position, "amount")).toBeUint(uintWithDecimals(1000).value);
    expect(tupleField(position, "cumm-reward")).toBeUint(0);

    expect(someValue(stStxBtcTrackingData.getHoldersAddressToIndex(deployer))).toBeUint(0);

    expect(someValue(stStxBtcTrackingData.getHoldersIndexToAddress(0))).toBePrincipal(deployer);

    expect(stStxBtcTrackingData.getNextHolderIndex()).toBeUint(1);
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("ststxbtc-tracking-data: only protocol can call setters and helpers", () => {
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    expect(stStxBtcTrackingData.setTotalSupply(wallet_1, 1000)).toBeErr(Cl.uint(20003));

    expect(stStxBtcTrackingData.setNextHolderIndex(wallet_1, 1000)).toBeErr(Cl.uint(20003));

    expect(stStxBtcTrackingData.setCummReward(wallet_1, 1000)).toBeErr(Cl.uint(20003));

    expect(
      stStxBtcTrackingData.setSupportedPositions(
        wallet_1,
        wallet_1,
        true,
        qualifiedName("position-mock"),
        0,
        0,
      ),
    ).toBeErr(Cl.uint(20003));

    expect(
      stStxBtcTrackingData.setHoldersAddressToIndex(wallet_1, wallet_1, 1),
    ).toBeErr(Cl.uint(20003));

    expect(
      stStxBtcTrackingData.setHoldersIndexToAddress(wallet_1, 1, wallet_1),
    ).toBeErr(Cl.uint(20003));

    expect(
      stStxBtcTrackingData.setHolderPosition(wallet_1, wallet_1, wallet_1, 1000, 10),
    ).toBeErr(Cl.uint(20003));

    expect(stStxBtcTrackingData.addHolder(wallet_1, wallet_1)).toBeErr(Cl.uint(20003));

    expect(
      stStxBtcTrackingData.updateHolderPosition(wallet_1, wallet_1, qualifiedName("position-mock")),
    ).toBeErr(Cl.uint(20003));

    expect(
      stStxBtcTrackingData.updateHolderPositionAmount(
        wallet_1,
        wallet_1,
        qualifiedName("position-mock"),
        1000,
      ),
    ).toBeErr(Cl.uint(20003));

    expect(
      stStxBtcTrackingData.updateSupportedPositionsTotal(
        wallet_1,
        qualifiedName("position-mock"),
        1000,
      ),
    ).toBeErr(Cl.uint(20003));
  });
});
