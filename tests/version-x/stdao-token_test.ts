import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { uintWithDecimals } from "../wrappers/tests-utils";
import { SDAOToken } from "../wrappers/sdao-token-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_4 = accounts.get("wallet_4")!;

//-------------------------------------
// Getters
//-------------------------------------

describe("sdao-token", () => {
  it("sdao-token: can get token info", () => {
    const sDaoToken = new SDAOToken(deployer);

    expect(sDaoToken.mintForProtocol(deployer, 100, deployer)).toBeOk(Cl.bool(true));

    expect(sDaoToken.getTotalSupply()).toBeOk(uintWithDecimals(100));

    expect(sDaoToken.getName()).toBeOk(Cl.stringAscii("StackingDAO Token"));

    expect(sDaoToken.getSymbol()).toBeOk(Cl.stringAscii("sDAO"));

    expect(sDaoToken.getDecimals()).toBeOk(Cl.uint(6));

    expect(sDaoToken.getBalance(deployer)).toBeOk(uintWithDecimals(100));

    expect(sDaoToken.getBalance(wallet_4)).toBeOk(uintWithDecimals(0));

    expect(sDaoToken.getTokenUri()).toBeOk(Cl.some(Cl.stringUtf8("")));
  });

  //-------------------------------------
  // Core
  //-------------------------------------

  it("sdao-token: can mint/burn as protocol", () => {
    const sDaoToken = new SDAOToken(deployer);

    expect(sDaoToken.getTotalSupply()).toBeOk(uintWithDecimals(0));

    expect(sDaoToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(0));

    expect(sDaoToken.mintForProtocol(deployer, 100, wallet_1)).toBeOk(Cl.bool(true));

    expect(sDaoToken.getTotalSupply()).toBeOk(uintWithDecimals(100));

    expect(sDaoToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(100));

    expect(sDaoToken.burnForProtocol(deployer, 20, wallet_1)).toBeOk(Cl.bool(true));

    expect(sDaoToken.getTotalSupply()).toBeOk(uintWithDecimals(80));

    expect(sDaoToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(80));

    expect(sDaoToken.burn(wallet_1, 30)).toBeOk(Cl.bool(true));

    expect(sDaoToken.getTotalSupply()).toBeOk(uintWithDecimals(50));

    expect(sDaoToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(50));
  });

  it("sdao-token: can transfer token", () => {
    const sDaoToken = new SDAOToken(deployer);

    expect(sDaoToken.mintForProtocol(deployer, 100, wallet_1)).toBeOk(Cl.bool(true));

    expect(sDaoToken.transfer(wallet_1, 20, wallet_2)).toBeOk(Cl.bool(true));

    expect(sDaoToken.getTotalSupply()).toBeOk(uintWithDecimals(100));

    expect(sDaoToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(80));

    expect(sDaoToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(20));
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("sdao-token: can set token URI", () => {
    const sDaoToken = new SDAOToken(deployer);

    expect(sDaoToken.getTokenUri()).toBeOk(Cl.some(Cl.stringUtf8("")));

    expect(sDaoToken.setTokenUri(deployer, "test-uri")).toBeOk(Cl.bool(true));

    expect(sDaoToken.getTokenUri()).toBeOk(Cl.some(Cl.stringUtf8("test-uri")));
  });

  //-------------------------------------
  // Error
  //-------------------------------------

  it("sdao-token: can not transfer is sender is not tx-sender, or sender has not enough", () => {
    const sDaoToken = new SDAOToken(deployer);

    let r = simnet.callPublicFn(
      "sdao-token",
      "transfer",
      [
        Cl.uint(100 * 1_000_000),
        Cl.principal(wallet_1),
        Cl.principal(wallet_2),
        Cl.none(),
      ],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(1401));

    expect(sDaoToken.transfer(wallet_1, 20, wallet_1)).toBeErr(Cl.uint(2));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("sdao-token: only protocol can set token URI, mint and burn for protocol", () => {
    const sDaoToken = new SDAOToken(deployer);

    expect(sDaoToken.setTokenUri(wallet_1, "test-uri")).toBeErr(Cl.uint(20003));

    expect(sDaoToken.mintForProtocol(wallet_1, 100, wallet_1)).toBeErr(Cl.uint(20003));

    expect(sDaoToken.burnForProtocol(wallet_1, 100, deployer)).toBeErr(Cl.uint(20003));
  });
});
