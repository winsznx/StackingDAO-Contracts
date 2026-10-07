import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { uintWithDecimals } from "../wrappers/tests-utils";
import { StStxToken } from "../wrappers/ststx-token-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;

//-------------------------------------
// Getters
//-------------------------------------

describe("ststx-token", () => {
  it("ststx-token: can get token info", () => {
    const stStxToken = new StStxToken(deployer);

    expect(stStxToken.getTotalSupply()).toBeOk(uintWithDecimals(0));

    expect(stStxToken.getName()).toBeOk(Cl.stringAscii("Stacked STX Token"));

    expect(stStxToken.getSymbol()).toBeOk(Cl.stringAscii("stSTX"));

    expect(stStxToken.getDecimals()).toBeOk(Cl.uint(6));

    expect(stStxToken.getBalance(deployer)).toBeOk(uintWithDecimals(0));

    expect(stStxToken.getTokenUri()).toBeOk(Cl.some(Cl.stringUtf8("")));
  });

  //-------------------------------------
  // Core
  //-------------------------------------

  it("ststx-token: can mint/burn as protocol", () => {
    const stStxToken = new StStxToken(deployer);

    expect(stStxToken.getTotalSupply()).toBeOk(uintWithDecimals(0));

    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(0));

    expect(stStxToken.mintForProtocol(deployer, 100, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxToken.getTotalSupply()).toBeOk(uintWithDecimals(100));

    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(100));

    expect(stStxToken.burnForProtocol(deployer, 20, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxToken.getTotalSupply()).toBeOk(uintWithDecimals(80));

    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(80));

    expect(stStxToken.burn(wallet_1, 30)).toBeOk(Cl.bool(true));

    expect(stStxToken.getTotalSupply()).toBeOk(uintWithDecimals(50));

    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(50));
  });

  it("ststx-token: can transfer token", () => {
    const stStxToken = new StStxToken(deployer);

    expect(stStxToken.mintForProtocol(deployer, 100, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxToken.transfer(wallet_1, 20, wallet_2)).toBeOk(Cl.bool(true));

    expect(stStxToken.getTotalSupply()).toBeOk(uintWithDecimals(100));

    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(80));

    expect(stStxToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(20));
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("ststx-token: can set token URI", () => {
    const stStxToken = new StStxToken(deployer);

    expect(stStxToken.getTokenUri()).toBeOk(Cl.some(Cl.stringUtf8("")));

    expect(stStxToken.setTokenUri(deployer, "test-uri")).toBeOk(Cl.bool(true));

    expect(stStxToken.getTokenUri()).toBeOk(Cl.some(Cl.stringUtf8("test-uri")));
  });

  //-------------------------------------
  // Error
  //-------------------------------------

  it("ststx-token: can not transfer is sender is not tx-sender, or sender has not enough", () => {
    const stStxToken = new StStxToken(deployer);

    const { result } = simnet.callPublicFn(
      "ststx-token",
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

    expect(stStxToken.transfer(wallet_1, 20, wallet_1)).toBeErr(Cl.uint(2));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("ststx-token: only protocol can set token URI, mint and burn for protocol", () => {
    const stStxToken = new StStxToken(deployer);

    expect(stStxToken.setTokenUri(wallet_1, "test-uri")).toBeErr(Cl.uint(20003));

    expect(stStxToken.mintForProtocol(wallet_1, 100, wallet_1)).toBeErr(Cl.uint(20003));

    expect(stStxToken.burnForProtocol(wallet_1, 100, deployer)).toBeErr(Cl.uint(20003));
  });
});
