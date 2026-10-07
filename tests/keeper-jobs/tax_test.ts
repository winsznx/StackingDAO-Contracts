import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { qualifiedName, uintWithDecimals } from "../wrappers/tests-utils";
import { SDAOToken } from "../wrappers/sdao-token-helpers";
import { Tax } from "../wrappers/tax-helpers";
import { CoreV1 as Core } from "../wrappers/stacking-dao-core-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Tax
//-------------------------------------

describe("tax", () => {
  it("tax: handle tax", () => {
    const sDaoToken = new SDAOToken(deployer);
    const tax = new Tax(deployer);
    const core = new Core(deployer);

    // Get sDAO for liquidity
    expect(sDaoToken.mintForProtocol(deployer, 1000, deployer)).toBeOk(Cl.bool(true));

    // Create sDAO/STX pair
    expect(
      simnet.callPublicFn(
        "swap",
        "create-pair",
        [
          Cl.principal(qualifiedName("sdao-token")),
          Cl.principal(qualifiedName("wstx-token")),
          Cl.principal(qualifiedName("swap-lp-token")),
          Cl.uint(100),
          Cl.stringAscii("sDAO-STX"),
          Cl.uint(100 * 1_000_000),
          Cl.uint(100 * 1_000_000),
        ],
        deployer,
      ).result,
    ).toBeOk(Cl.bool(true));

    // Transfer 100 STX to contract
    expect(simnet.transferSTX(100 * 1_000_000, qualifiedName("tax-v1"), deployer).result).toBeOk(Cl.bool(true));

    // Contract balances
    expect(core.getStxBalance(qualifiedName("tax-v1"))).toBeUint(uintWithDecimals(100).value);

    expect(sDaoToken.getBalance(qualifiedName("tax-v1"))).toBeOk(uintWithDecimals(0));

    expect(
      simnet.callReadOnlyFn(
        "swap-lp-token",
        "get-balance",
        [Cl.principal(qualifiedName("tax-v1"))],
        deployer,
      ).result,
    ).toBeOk(uintWithDecimals(0));

    // Handle tax
    expect(tax.handleTax(deployer)).toBeOk(Cl.bool(true));

    // Contract balances
    expect(core.getStxBalance(qualifiedName("tax-v1"))).toBeUint(uintWithDecimals(0).value);

    expect(sDaoToken.getBalance(qualifiedName("tax-v1"))).toBeOk(uintWithDecimals(0));

    expect(
      simnet.callReadOnlyFn(
        "swap-lp-token",
        "get-balance",
        [Cl.principal(qualifiedName("tax-v1"))],
        deployer,
      ).result,
    ).toBeOk(uintWithDecimals(99.623776));
  });

  //-------------------------------------
  // Keeper
  //-------------------------------------

  it("tax: keeper functions", () => {
    const tax = new Tax(deployer);

    expect(tax.checkJob()).toBeOk(Cl.bool(false));

    expect(tax.initialize(deployer)).toBeOk(Cl.bool(true));

    expect(tax.runJob(deployer)).toBeErr(Cl.uint(21001));

    // Transfer 100 STX to contract
    expect(simnet.transferSTX(100 * 1_000_000, qualifiedName("tax-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(tax.checkJob()).toBeOk(Cl.bool(true));

    // Can not swap as pair not created
    expect(tax.runJob(deployer)).toBeErr(Cl.uint(21002));
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("tax: protocol can retreive tokens", () => {
    const tax = new Tax(deployer);
    const sDaoToken = new SDAOToken(deployer);
    const core = new Core(deployer);

    // Transfer 100 STX to contract
    expect(simnet.transferSTX(100 * 1_000_000, qualifiedName("tax-v1"), deployer).result).toBeOk(Cl.bool(true));

    // Transfer 100 sDAO to contract
    expect(sDaoToken.mintForProtocol(deployer, 100, qualifiedName("tax-v1"))).toBeOk(Cl.bool(true));

    // Contract balances
    expect(core.getStxBalance(qualifiedName("tax-v1"))).toBeUint(uintWithDecimals(100).value);

    expect(sDaoToken.getBalance(qualifiedName("tax-v1"))).toBeOk(uintWithDecimals(100));

    // Retreive tokens
    expect(tax.retreiveStxTokens(deployer, 10, deployer)).toBeOk(uintWithDecimals(10));

    expect(tax.retreiveTokens(deployer, "sdao-token", 10, deployer)).toBeOk(uintWithDecimals(10));

    // Contract balances
    expect(core.getStxBalance(qualifiedName("tax-v1"))).toBeUint(uintWithDecimals(90).value);

    expect(sDaoToken.getBalance(qualifiedName("tax-v1"))).toBeOk(uintWithDecimals(90));
  });

  it("tax: protocol can set min amount to handle", () => {
    const tax = new Tax(deployer);

    expect(tax.setMinBalanceToHandle(deployer, 500)).toBeOk(Cl.bool(true));

    expect(tax.getMinBalanceToHandle()).toBeUint(uintWithDecimals(500).value);
  });

  it("tax: protocol can set percentage to swap", () => {
    const tax = new Tax(deployer);

    expect(tax.setPercentageToSwap(deployer, 0.2)).toBeOk(Cl.bool(true));

    expect(tax.getPercentageToSwap()).toBeUint(0.2 * 10_000);
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("tax: only protocol can retreive tokens", () => {
    const tax = new Tax(deployer);

    expect(tax.retreiveStxTokens(wallet_1, 10, wallet_1)).toBeErr(Cl.uint(20003));

    expect(tax.retreiveTokens(wallet_1, "sdao-token", 10, wallet_1)).toBeErr(Cl.uint(20003));
  });

  it("tax: only protocol can set min amount to handle and percentage to swap", () => {
    const tax = new Tax(deployer);

    expect(tax.setMinBalanceToHandle(wallet_1, 500)).toBeErr(Cl.uint(20003));

    expect(tax.setPercentageToSwap(wallet_1, 0.2)).toBeErr(Cl.uint(20003));
  });
});
