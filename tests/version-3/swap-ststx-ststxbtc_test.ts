import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { qualifiedName, uintWithDecimals } from "../wrappers/tests-utils";
import { Core } from "../wrappers/stacking-dao-core-helpers";
import { CoreBtc } from "../wrappers/stacking-dao-core-btc-helpers";
import { Reserve } from "../wrappers/reserve-helpers";
import { DataCore } from "../wrappers/data-core-helpers";
import { SwapStStxBtc } from "../wrappers/swap-ststx-ststxbtc-helpers";
import { StStxToken } from "../wrappers/ststx-token-helpers";
import { StStxBtcToken } from "../wrappers/ststxbtc-token-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;

//-------------------------------------
// Core
//-------------------------------------

describe("swap-ststx-ststxbtc", () => {
  it("swap-ststx-ststxbtc: swaps", () => {
    const reserve = new Reserve(deployer);
    const core = new Core(deployer);
    const coreBtc = new CoreBtc(deployer);
    const dataCore = new DataCore(deployer);
    const swap = new SwapStStxBtc(deployer);
    const stStxToken = new StStxToken(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);

    // Deposit and add rewards for stSTX
    expect(core.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    expect(simnet.transferSTX(100 * 1_000_000, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(dataCore.getStxPerStStx(qualifiedName("reserve-v1"))).toBeOk(uintWithDecimals(1.1));

    // Deposit for stSTXbtc
    expect(coreBtc.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    // Balance
    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(1000));
    expect(stStxBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(1000));

    expect(reserve.getStxBalance()).toBeOk(uintWithDecimals(1000 + 100 + 1000));

    // Swap stSTX for stSTXbtc
    expect(swap.swapStStxForStStxBtc(wallet_1, 100)).toBeOk(uintWithDecimals(110));

    // Balance
    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(900));
    expect(stStxBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(1110));

    // Swap stSTXbtc for stSTX
    expect(swap.swapStStxBtcForStStx(wallet_1, 110)).toBeOk(uintWithDecimals(100));

    // Balance
    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(1000));
    expect(stStxBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(1000));
  });

  it("swap-ststx-ststxbtc: swaps rounding", () => {
    const core = new Core(deployer);
    const coreBtc = new CoreBtc(deployer);
    const dataCore = new DataCore(deployer);
    const swap = new SwapStStxBtc(deployer);

    // Deposit and add rewards for stSTX
    expect(core.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    expect(simnet.transferSTX(523 * 1473837, qualifiedName("reserve-v1"), deployer).result).toBeOk(Cl.bool(true));

    expect(dataCore.getStxPerStStx(qualifiedName("reserve-v1"))).toBeOk(uintWithDecimals(1.770816));

    // Deposit for stSTXbtc
    expect(coreBtc.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    // Swap stSTX for stSTXbtc
    expect(swap.swapStStxForStStxBtc(wallet_1, 100)).toBeOk(uintWithDecimals(177.0816));

    expect(swap.swapStStxForStStxBtc(wallet_1, 99.953919)).toBeOk(uintWithDecimals(176.999999));

    // Swap stSTXbtc for stSTX
    expect(swap.swapStStxBtcForStStx(wallet_1, 177)).toBeOk(uintWithDecimals(99.953919));

    expect(swap.swapStStxBtcForStStx(wallet_1, 177.0816)).toBeOk(uintWithDecimals(100));
  });

  //-------------------------------------
  // Errors
  //-------------------------------------

  it("swap-ststx-ststxbtc: can not use wrong reserve", () => {
    let r = simnet.callPublicFn(
      "swap-ststx-ststxbtc-v2",
      "swap-ststx-for-ststxbtc",
      [Cl.uint(100 * 1_000_000), Cl.principal(qualifiedName("fake-reserve"))],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(20003));

    r = simnet.callPublicFn(
      "swap-ststx-ststxbtc-v2",
      "swap-ststxbtc-for-ststx",
      [Cl.uint(100 * 1_000_000), Cl.principal(qualifiedName("fake-reserve"))],
      deployer,
    ).result;
    expect(r).toBeErr(Cl.uint(20003));
  });

  it("swap-ststx-ststxbtc: can not swap more than wallet balance", () => {
    const core = new Core(deployer);
    const coreBtc = new CoreBtc(deployer);
    const swap = new SwapStStxBtc(deployer);
    const stStxToken = new StStxToken(deployer);

    // Deposit and add rewards for stSTX
    expect(core.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));
    expect(core.deposit(wallet_2, 1000)).toBeOk(uintWithDecimals(1000));

    // Deposit for stSTXbtc
    expect(coreBtc.deposit(wallet_2, 1000)).toBeOk(uintWithDecimals(1000));

    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(1000));

    // Swap stSTX for stSTXbtc
    expect(swap.swapStStxForStStxBtc(wallet_1, 1001)).toBeErr(Cl.uint(1));

    expect(swap.swapStStxForStStxBtc(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    // Swap stSTXbtc for stSTX
    expect(swap.swapStStxBtcForStStx(wallet_1, 1001)).toBeErr(Cl.uint(1));

    expect(swap.swapStStxBtcForStStx(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));
  });

  it("swap-ststx-ststxbtc: total supply of tokens after swap should be higher than 1", () => {
    const core = new Core(deployer);
    const swap = new SwapStStxBtc(deployer);
    const stStxToken = new StStxToken(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);

    // Deposit and add rewards for stSTX
    expect(core.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    expect(stStxToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(1000));

    // Swap stSTX for stSTXbtc
    expect(swap.swapStStxForStStxBtc(wallet_1, 1000)).toBeErr(Cl.uint(903001));

    expect(swap.swapStStxForStStxBtc(wallet_1, 998)).toBeOk(uintWithDecimals(998));

    expect(stStxToken.getTotalSupply()).toBeOk(uintWithDecimals(2));
    expect(stStxBtcToken.getTotalSupply()).toBeOk(uintWithDecimals(998));

    // Swap stSTXbtc to stSTX
    expect(swap.swapStStxBtcForStStx(wallet_1, 998)).toBeErr(Cl.uint(903001));

    expect(swap.swapStStxBtcForStStx(wallet_1, 996)).toBeOk(uintWithDecimals(996));
  });
});
