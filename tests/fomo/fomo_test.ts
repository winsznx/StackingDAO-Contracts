import { describe, expect, it } from "vitest";
import { Cl, ClarityType } from "@stacks/transactions";

import { qualifiedName, uintWithDecimals } from "../wrappers/tests-utils";
import { Core, CoreV1 } from "../wrappers/stacking-dao-core-helpers";
import { Fomo } from "../wrappers/fomo-helpers";
import { StStxToken } from "../wrappers/ststx-token-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;

//-------------------------------------
// Core
//-------------------------------------

describe("fomo", () => {
  it("fomo: can buy the claim", () => {
    const corev1 = new CoreV1(deployer);
    const core = new Core(deployer);
    const fomo = new Fomo(deployer);
    const stStxToken = new StStxToken(deployer);

    expect(corev1.getStxBalance(wallet_1)).toBeUint(uintWithDecimals(100000000).value);

    expect(core.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    expect(core.deposit(deployer, 1000)).toBeOk(uintWithDecimals(1000));

    expect(fomo.startGame(wallet_1)).toBeErr(Cl.uint(20003));

    expect(fomo.startGame(deployer)).toBeOk(Cl.bool(true));

    expect(stStxToken.transfer(deployer, 100, qualifiedName("fomo"))).toHaveClarityType(ClarityType.ResponseOk);
    expect(stStxToken.getBalance(qualifiedName("fomo"))).toBeOk(uintWithDecimals(100));

    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(1000));

    expect(fomo.buyClaim(wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(998.9));

    expect(fomo.getCurrentWinner()).toBePrincipal(wallet_1);

    expect(fomo.buyClaim(deployer)).toBeOk(Cl.bool(true));

    expect(fomo.getCurrentWinner()).toBePrincipal(deployer);
  });

  it("fomo: can play a whole game", () => {
    const corev1 = new CoreV1(deployer);
    const core = new Core(deployer);
    const fomo = new Fomo(deployer);
    const stStxToken = new StStxToken(deployer);

    expect(corev1.getStxBalance(wallet_1)).toBeUint(uintWithDecimals(100000000).value);

    expect(core.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    expect(fomo.startGame(deployer)).toBeOk(Cl.bool(true));

    expect(core.deposit(deployer, 1000)).toBeOk(uintWithDecimals(1000));

    expect(core.deposit(wallet_2, 1000)).toBeOk(uintWithDecimals(1000));

    expect(core.deposit(wallet_3, 1000)).toBeOk(uintWithDecimals(1000));

    expect(stStxToken.transfer(deployer, 100, qualifiedName("fomo"))).toHaveClarityType(ClarityType.ResponseOk);
    expect(stStxToken.getBalance(qualifiedName("fomo"))).toBeOk(uintWithDecimals(100));

    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(1000));

    expect(fomo.buyClaim(wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(998.9));

    expect(fomo.getCurrentWinner()).toBePrincipal(wallet_1);

    expect(fomo.buyClaim(deployer)).toBeOk(Cl.bool(true));

    expect(fomo.getCurrentWinner()).toBePrincipal(deployer);

    expect(fomo.buyClaim(wallet_2)).toBeOk(Cl.bool(true));

    expect(fomo.buyClaim(wallet_3)).toBeOk(Cl.bool(true));

    simnet.mineEmptyBlocks(100);

    expect(fomo.hasGameEnded()).toBeBool(false);

    simnet.mineEmptyBlocks(144);

    expect(fomo.hasGameEnded()).toBeBool(true);

    expect(fomo.getCurrentWinner()).toBePrincipal(wallet_3);

    expect(fomo.retrieveWinner(wallet_2, 2)).toBeErr(Cl.uint(6660004));

    expect(stStxToken.getBalance(wallet_3)).toBeOk(uintWithDecimals(998.6)); // before claiming prize

    expect(stStxToken.getBalance(qualifiedName("fomo"))).toBeOk(uintWithDecimals(105));

    expect(fomo.retrieveWinner(wallet_3, 3)).toBeOk(Cl.uint(73500000));

    expect(fomo.retrieveWinner(wallet_3, 3)).toBeErr(Cl.uint(6660006));

    expect(stStxToken.getBalance(wallet_3)).toBeOk(uintWithDecimals(998.6 + 73.5));

    expect(fomo.retrieveLoser(wallet_2, 2)).toBeOk(uintWithDecimals(8.75));

    expect(fomo.retrieveLoser(wallet_1, 0)).toBeOk(uintWithDecimals(8.75));

    expect(fomo.retrieveLoser(deployer, 1)).toBeOk(uintWithDecimals(8.75));

    expect(fomo.retrieveFees(deployer)).toBeOk(uintWithDecimals(5.25));
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("fomo: cannot buy the claim if game ended", () => {
    const core = new Core(deployer);
    const fomo = new Fomo(deployer);

    expect(core.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    expect(fomo.startGame(deployer)).toBeOk(Cl.bool(true));

    expect(fomo.getCurrentWinner()).toBePrincipal(deployer);

    simnet.mineEmptyBlocks(144);

    expect(fomo.buyClaim(wallet_1)).toBeErr(Cl.uint(6660001));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("fomo: can/cannot change increment", () => {
    const fomo = new Fomo(deployer);

    expect(fomo.setIncrement(wallet_1, 1000)).toBeErr(Cl.uint(20003));

    expect(fomo.setIncrement(deployer, 1000)).toBeOk(Cl.bool(true));

    expect(fomo.getIncrement()).toBeUint(uintWithDecimals(1000).value);
  });

  it("fomo: can rescue funds", () => {
    const core = new Core(deployer);
    const fomo = new Fomo(deployer);

    expect(core.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    expect(fomo.startGame(deployer)).toBeOk(Cl.bool(true));

    expect(fomo.buyClaim(wallet_1)).toBeOk(Cl.bool(true));

    expect(fomo.rescueFunds(wallet_1)).toBeErr(Cl.uint(20003));

    expect(fomo.rescueFunds(deployer)).toBeOk(uintWithDecimals(1.1));
  });
});
