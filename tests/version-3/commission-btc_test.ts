import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { qualifiedName, uintWithDecimals } from "../wrappers/tests-utils";
import { CommissionBtc as Commission } from "../wrappers/commission-btc-helpers";
import { SBtcToken } from "../wrappers/sbtc-token-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Core
//-------------------------------------

describe("commission-btc", () => {
  it("commission-btc: can add and withdraw commission", () => {
    const sBtcToken = new SBtcToken(deployer);
    const commission = new Commission(deployer);

    expect(commission.setStakingBasisPoints(deployer, 0.8)).toBeOk(Cl.bool(true));

    sBtcToken.protocolMint(deployer, 100000000, deployer);
    sBtcToken.protocolMint(deployer, 100000000, wallet_1);

    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(100000000, 8));

    expect(commission.addCommission(wallet_1, 5000)).toBeOk(uintWithDecimals(5000, 8));

    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(99999000, 8));

    expect(sBtcToken.getBalance(deployer)).toBeOk(uintWithDecimals(100000000, 8));

    // Can withdraw 20% of total commission
    // 20% of 5000 STX = 1000 STX
    expect(sBtcToken.getBalance(qualifiedName("commission-btc-v1"))).toBeOk(uintWithDecimals(1000, 8));

    expect(commission.withdrawCommission(deployer, 1000, deployer)).toBeOk(uintWithDecimals(1000, 8));

    expect(sBtcToken.getBalance(deployer)).toBeOk(uintWithDecimals(100001000, 8));
  });

  it("commission-btc: can set staking percentage", () => {
    const sBtcToken = new SBtcToken(deployer);
    const commission = new Commission(deployer);

    expect(commission.setStakingBasisPoints(deployer, 0.8)).toBeOk(Cl.bool(true));

    sBtcToken.protocolMint(deployer, 100000000, wallet_1);

    expect(commission.addCommission(wallet_1, 5000)).toBeOk(uintWithDecimals(5000, 8));

    // Can withdraw 20% of total commission
    // 20% of 5000 STX = 1000 STX
    expect(commission.withdrawCommission(deployer, 1000, deployer)).toBeOk(uintWithDecimals(1000, 8));

    expect(commission.setStakingBasisPoints(deployer, 0.7)).toBeOk(Cl.bool(true));

    expect(commission.addCommission(wallet_1, 5000)).toBeOk(uintWithDecimals(5000, 8));

    // Can withdraw 30% of total commission
    // 30% of 5000 STX = 1500 STX
    expect(commission.withdrawCommission(deployer, 1500, deployer)).toBeOk(uintWithDecimals(1500, 8));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("commission-btc: can not add commission with wrong staking contract", () => {
    const sBtcToken = new SBtcToken(deployer);
    const commission = new Commission(deployer);

    expect(commission.setStakingBasisPoints(deployer, 0.8)).toBeOk(Cl.bool(true));

    sBtcToken.protocolMint(deployer, 100000000, wallet_1);

    expect(commission.addCommission(wallet_1, 5000)).toBeOk(uintWithDecimals(5000, 8));

    const { result } = simnet.callPublicFn(
      "commission-btc-v1",
      "add-commission",
      [Cl.principal(qualifiedName("fake-staking")), Cl.uint(5000 * 100_000_000)],
      wallet_1,
    );
    expect(result).toBeErr(Cl.uint(20003));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("commission-btc: only protocol can withdraw commission", () => {
    const commission = new Commission(deployer);

    expect(commission.withdrawCommission(wallet_1, 1, wallet_1)).toBeErr(Cl.uint(20003));
  });

  it("commission-btc: only protocol can set staking percentage", () => {
    const commission = new Commission(deployer);

    expect(commission.setStakingBasisPoints(wallet_1, 10)).toBeErr(Cl.uint(20003));
  });
});
