import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import {
  tupleField,
  uintWithDecimals,
} from "../wrappers/tests-utils";
import { CoreBtc } from "../wrappers/stacking-dao-core-btc-helpers";
import { StStxBtcTokenV1, StStxBtcToken } from "../wrappers/ststxbtc-token-helpers";
import { StStxBtcTrackingData } from "../wrappers/ststxbtc-tracking-data-helpers";
import { SBtcToken } from "../wrappers/sbtc-token-helpers";
import { StStxBtcTracking } from "../wrappers/ststxbtc-tracking-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;

//-------------------------------------
// Core
//-------------------------------------

describe("ststxbtc-migration", () => {
  it("ststxbtc-migration: successful migration", () => {
    const stStxBtcTokenV1 = new StStxBtcTokenV1(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);
    const trackingData = new StStxBtcTrackingData(deployer);

    // Mint stStxBtcTokenV1 tokens to wallet_1 and wallet_2
    expect(stStxBtcTokenV1.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));
    expect(stStxBtcTokenV1.mintForProtocol(deployer, 2000, wallet_2)).toBeOk(Cl.bool(true));

    // Check initial balances
    expect(stStxBtcTokenV1.getBalance(wallet_1)).toBeOk(uintWithDecimals(1000));
    expect(stStxBtcTokenV1.getBalance(wallet_2)).toBeOk(uintWithDecimals(2000));

    expect(stStxBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(0));
    expect(stStxBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(0));

    // Check initial tracking data
    let trackingBalance = simnet.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-holder-position",
      [Cl.principal(wallet_1), Cl.principal(wallet_1)],
      deployer,
    ).result;
    expect(tupleField(trackingBalance, "amount")).toBeUint(uintWithDecimals(1000).value);
    trackingBalance = simnet.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-holder-position",
      [Cl.principal(wallet_2), Cl.principal(wallet_2)],
      deployer,
    ).result;
    expect(tupleField(trackingBalance, "amount")).toBeUint(uintWithDecimals(2000).value);
    trackingBalance = trackingData.getHolderPosition(wallet_1, wallet_1);
    expect(tupleField(trackingBalance, "amount")).toBeUint(uintWithDecimals(0).value);
    trackingBalance = trackingData.getHolderPosition(wallet_2, wallet_2);
    expect(tupleField(trackingBalance, "amount")).toBeUint(uintWithDecimals(0).value);

    // Migrate stStxBtcTokenV1 tokens to stStxBtcToken for wallet_1
    let migrateResult = simnet.callPublicFn(
      "ststxbtc-migration-v1",
      "migrate-ststxbtc",
      [Cl.list([Cl.principal(wallet_1)])],
      deployer,
    ).result;
    expect(migrateResult).toBeOk(Cl.list([Cl.ok(Cl.bool(true))]));

    // Self migrate stStxBtcTokenV1 tokens to stStxBtcToken for wallet_2
    let selfMigrate = simnet.callPublicFn(
      "ststxbtc-migration-v1",
      "migrate-self",
      [],
      wallet_2,
    ).result;
    expect(selfMigrate).toBeOk(Cl.bool(true));

    // Check balances
    expect(stStxBtcTokenV1.getBalance(wallet_1)).toBeOk(uintWithDecimals(0));
    expect(stStxBtcTokenV1.getBalance(wallet_2)).toBeOk(uintWithDecimals(0));

    expect(stStxBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(1000));
    expect(stStxBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(2000));

    // Check tracking data
    trackingBalance = simnet.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-holder-position",
      [Cl.principal(wallet_1), Cl.principal(wallet_1)],
      deployer,
    ).result;
    expect(tupleField(trackingBalance, "amount")).toBeUint(uintWithDecimals(0).value);
    trackingBalance = simnet.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-holder-position",
      [Cl.principal(wallet_2), Cl.principal(wallet_2)],
      deployer,
    ).result;
    expect(tupleField(trackingBalance, "amount")).toBeUint(uintWithDecimals(0).value);
    trackingBalance = trackingData.getHolderPosition(wallet_1, wallet_1);
    expect(tupleField(trackingBalance, "amount")).toBeUint(uintWithDecimals(1000).value);
    trackingBalance = trackingData.getHolderPosition(wallet_2, wallet_2);
    expect(tupleField(trackingBalance, "amount")).toBeUint(uintWithDecimals(2000).value);
  });

  it("ststxbtc-migration: rewards are claimed on migration", () => {
    const stStxBtcTokenV1 = new StStxBtcTokenV1(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);
    const sBtcToken = new SBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);

    // Mint sBTC tokens for rewards
    expect(sBtcToken.protocolMint(deployer, 1000, deployer)).toBeOk(Cl.bool(true));

    // Mint stStxBtcToken tokens
    expect(stStxBtcToken.mintForProtocol(deployer, 1000, deployer)).toBeOk(Cl.bool(true));

    // Mint stStxBtcTokenV1 tokens to wallet_1 and wallet_2
    expect(stStxBtcTokenV1.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));
    expect(stStxBtcTokenV1.mintForProtocol(deployer, 2000, wallet_2)).toBeOk(Cl.bool(true));

    // Check initial balances
    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(0));
    expect(sBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(0));

    // Add rewards for both tokens
    let addResV1 = simnet.callPublicFn(
      "ststxbtc-tracking",
      "add-rewards",
      [Cl.uint(300 * 100_000_000)],
      deployer,
    ).result;
    expect(addResV1).toBeOk(Cl.bool(true));

    expect(stStxBtcTracking.addRewards(deployer, 300)).toBeOk(Cl.bool(true));

    // Check pending rewards
    let call = simnet.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-pending-rewards",
      [Cl.principal(wallet_1), Cl.principal(wallet_1)],
      deployer,
    ).result;
    expect(call).toBeOk(uintWithDecimals(100, 8));

    call = simnet.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-pending-rewards",
      [Cl.principal(wallet_2), Cl.principal(wallet_2)],
      deployer,
    ).result;
    expect(call).toBeOk(uintWithDecimals(200, 8));

    expect(stStxBtcTracking.getPendingRewards(wallet_1, wallet_1)).toBeOk(uintWithDecimals(0, 8));
    expect(stStxBtcTracking.getPendingRewards(wallet_2, wallet_2)).toBeOk(uintWithDecimals(0, 8));

    // Migrate stStxBtcTokenV1 tokens to stStxBtcToken for wallet_1
    let migrateResult = simnet.callPublicFn(
      "ststxbtc-migration-v1",
      "migrate-ststxbtc",
      [Cl.list([Cl.principal(wallet_1)])],
      deployer,
    ).result;
    expect(migrateResult).toBeOk(Cl.list([Cl.ok(Cl.bool(true))]));

    // Self migrate stStxBtcTokenV1 tokens to stStxBtcToken for wallet_2
    let selfMigrate = simnet.callPublicFn(
      "ststxbtc-migration-v1",
      "migrate-self",
      [],
      wallet_2,
    ).result;
    expect(selfMigrate).toBeOk(Cl.bool(true));

    // Check balances
    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(100, 8));
    expect(sBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(200, 8));

    // Check pending rewards
    call = simnet.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-pending-rewards",
      [Cl.principal(wallet_1), Cl.principal(wallet_1)],
      deployer,
    ).result;
    expect(call).toBeOk(uintWithDecimals(0, 8));

    call = simnet.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-pending-rewards",
      [Cl.principal(wallet_2), Cl.principal(wallet_2)],
      deployer,
    ).result;
    expect(call).toBeOk(uintWithDecimals(0, 8));

    expect(stStxBtcTracking.getPendingRewards(wallet_1, wallet_1)).toBeOk(uintWithDecimals(0, 8));
    expect(stStxBtcTracking.getPendingRewards(wallet_2, wallet_2)).toBeOk(uintWithDecimals(0, 8));
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("ststxbtc-migration: unauthorized caller", () => {
    let r = simnet.callPublicFn(
      "ststxbtc-migration-v1",
      "migrate-ststxbtc",
      [Cl.list([Cl.principal(wallet_1)])],
      wallet_1,
    ).result;
    expect(r).toBeErr(Cl.uint(20003));
  });

  it("ststxbtc-migration: unsupported position", () => {
    const coreBtc = new CoreBtc(deployer);

    // Deposit for stSTXbtc
    expect(coreBtc.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    // Set active position
    let setPos = simnet.callPublicFn(
      "ststxbtc-tracking-data",
      "set-supported-positions",
      [
        Cl.principal(wallet_1),
        Cl.bool(true),
        Cl.principal(deployer),
        Cl.uint(1000),
        Cl.uint(0),
      ],
      deployer,
    ).result;
    expect(setPos).toBeOk(Cl.bool(true));

    // Try to migrate tokens
    let migrateResult = simnet.callPublicFn(
      "ststxbtc-migration-v1",
      "migrate-ststxbtc",
      [Cl.list([Cl.principal(wallet_1)])],
      deployer,
    ).result;
    expect(migrateResult).toBeOk(Cl.list([Cl.error(Cl.uint(10401))]));
  });
});
