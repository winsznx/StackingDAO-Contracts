import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { uintWithDecimals } from "../wrappers/tests-utils";
import { StStxBtcToken } from "../wrappers/ststxbtc-token-helpers";
import { StStxBtcTracking } from "../wrappers/ststxbtc-tracking-helpers";
import { StStxBtcTrackingData } from "../wrappers/ststxbtc-tracking-data-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;

//-------------------------------------
// Getters
//-------------------------------------

describe("ststxbtc-token", () => {
  it("ststxbtc-token: can get token info", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);

    expect(stStxBtcToken.getTotalSupply()).toBeOk(uintWithDecimals(0));

    expect(stStxBtcToken.getName()).toBeOk(Cl.stringAscii("Stacked STX BTC Token"));

    expect(stStxBtcToken.getSymbol()).toBeOk(Cl.stringAscii("stSTXbtc"));

    expect(stStxBtcToken.getDecimals()).toBeOk(Cl.uint(6));

    expect(stStxBtcToken.getBalance(deployer)).toBeOk(uintWithDecimals(0));

    expect(stStxBtcToken.getTokenUri()).toBeOk(Cl.some(Cl.stringUtf8("")));
  });

  //-------------------------------------
  // Core
  //-------------------------------------

  it("ststxbtc-token: can mint/burn as protocol", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);

    expect(stStxBtcToken.getTotalSupply()).toBeOk(uintWithDecimals(0));

    expect(stStxBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(0));

    expect(stStxBtcToken.mintForProtocol(deployer, 100, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.getTotalSupply()).toBeOk(uintWithDecimals(100));

    expect(stStxBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(100));

    expect(stStxBtcToken.burnForProtocol(deployer, 20, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.getTotalSupply()).toBeOk(uintWithDecimals(80));

    expect(stStxBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(80));

    expect(stStxBtcToken.burn(wallet_1, 30)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.getTotalSupply()).toBeOk(uintWithDecimals(50));

    expect(stStxBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(50));
  });

  it("ststxbtc-token: can transfer token", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);

    expect(stStxBtcToken.mintForProtocol(deployer, 100, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.transfer(wallet_1, 20, wallet_2)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.getTotalSupply()).toBeOk(uintWithDecimals(100));

    expect(stStxBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(80));

    expect(stStxBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(20));
  });

  //-------------------------------------
  // Tracking
  //-------------------------------------

  it("ststxbtc-token: token mint/burn/transfer updates tracking", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    // Mint for protocol
    expect(stStxBtcToken.mintForProtocol(deployer, 100, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcTrackingData.getTotalSupply()).toBeUint(100 * 1_000_000);

    expect(stStxBtcTrackingData.getHolderPosition(wallet_1, wallet_1)).toBeTuple({
      amount: uintWithDecimals(100),
      "cumm-reward": uintWithDecimals(0),
    });

    // Burn for protocol
    expect(stStxBtcToken.burnForProtocol(deployer, 20, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcTrackingData.getTotalSupply()).toBeUint((100 - 20) * 1_000_000);

    expect(stStxBtcTrackingData.getHolderPosition(wallet_1, wallet_1)).toBeTuple({
      amount: uintWithDecimals(100 - 20),
      "cumm-reward": uintWithDecimals(0),
    });

    // Burn
    expect(stStxBtcToken.burn(wallet_1, 30)).toBeOk(Cl.bool(true));

    expect(stStxBtcTrackingData.getTotalSupply()).toBeUint((100 - 20 - 30) * 1_000_000);

    expect(stStxBtcTrackingData.getHolderPosition(wallet_1, wallet_1)).toBeTuple({
      amount: uintWithDecimals(100 - 20 - 30),
      "cumm-reward": uintWithDecimals(0),
    });

    // Transfer
    expect(stStxBtcToken.transfer(wallet_1, 10, deployer)).toBeOk(Cl.bool(true));

    expect(stStxBtcTrackingData.getTotalSupply()).toBeUint((100 - 20 - 30) * 1_000_000);

    expect(stStxBtcTrackingData.getHolderPosition(wallet_1, wallet_1)).toBeTuple({
      amount: uintWithDecimals(100 - 20 - 30 - 10),
      "cumm-reward": uintWithDecimals(0),
    });
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("ststxbtc-token: can set token URI", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);

    expect(stStxBtcToken.getTokenUri()).toBeOk(Cl.some(Cl.stringUtf8("")));

    expect(stStxBtcToken.setTokenUri(deployer, "test-uri")).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.getTokenUri()).toBeOk(Cl.some(Cl.stringUtf8("test-uri")));
  });

  //-------------------------------------
  // Error
  //-------------------------------------

  it("ststxbtc-token: can not transfer is sender is not tx-sender, or sender has not enough", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);

    const { result } = simnet.callPublicFn(
      "ststxbtc-token",
      "transfer",
      [
        Cl.uint(100 * 1_000_000),
        Cl.principal(wallet_1),
        Cl.principal(wallet_2),
        Cl.none(),
      ],
      deployer,
    );
    expect(result).toBeErr(Cl.uint(1401));

    expect(stStxBtcToken.transfer(wallet_1, 20, wallet_1)).toBeErr(Cl.uint(2));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("ststxbtc-token: only protocol can set token URI, mint and burn for protocol", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);

    expect(stStxBtcToken.setTokenUri(wallet_1, "test-uri")).toBeErr(Cl.uint(20003));

    expect(stStxBtcToken.mintForProtocol(wallet_1, 100, wallet_1)).toBeErr(Cl.uint(20003));

    expect(stStxBtcToken.burnForProtocol(wallet_1, 100, deployer)).toBeErr(Cl.uint(20003));
  });
});
