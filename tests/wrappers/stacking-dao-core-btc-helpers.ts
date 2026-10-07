import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// Core BTC V1
// ---------------------------------------------------------

export class CoreBtc {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getShutdownDeposits(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-btc-v3",
      "get-shutdown-deposits",
      [],
      this.deployer,
    ).result;
  }

  getShutdownInitWithdraw(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-btc-v3",
      "get-shutdown-init-withdraw",
      [],
      this.deployer,
    ).result;
  }

  getShutdownWithdraw(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-btc-v3",
      "get-shutdown-withdraw",
      [],
      this.deployer,
    ).result;
  }

  getShutdownWithdrawIdle(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-btc-v3",
      "get-shutdown-withdraw-idle",
      [],
      this.deployer,
    ).result;
  }

  getIdleCycle(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-btc-v3",
      "get-idle-cycle",
      [],
      this.deployer,
    ).result;
  }

  deposit(
    caller: string,
    amount: number,
    referrer: string | undefined = undefined,
    pool: string | undefined = undefined,
  ): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-btc-v3",
      "deposit",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.principal(qualifiedName("direct-helpers-v4")),
        Cl.uint(amount * 1_000_000),
        referrer == undefined ? Cl.none() : Cl.some(Cl.principal(referrer)),
        pool == undefined ? Cl.none() : Cl.some(Cl.principal(pool)),
      ],
      caller,
    ).result;
  }

  withdrawIdle(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-btc-v3",
      "withdraw-idle",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("direct-helpers-v4")),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.uint(amount * 1_000_000),
      ],
      caller,
    ).result;
  }

  initWithdraw(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-btc-v3",
      "init-withdraw",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("direct-helpers-v4")),
        Cl.uint(amount * 1_000_000),
      ],
      caller,
    ).result;
  }

  withdraw(caller: string, nftId: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-btc-v3",
      "withdraw",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.uint(nftId),
      ],
      caller,
    ).result;
  }

  setShutdownDeposits(caller: string, shutdown: boolean): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-btc-v3",
      "set-shutdown-deposits",
      [Cl.bool(shutdown)],
      caller,
    ).result;
  }

  setShutdownInitWithdraw(caller: string, shutdown: boolean): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-btc-v3",
      "set-shutdown-init-withdraw",
      [Cl.bool(shutdown)],
      caller,
    ).result;
  }

  setShutdownWithdrawIdle(caller: string, shutdown: boolean): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-btc-v3",
      "set-shutdown-withdraw-idle",
      [Cl.bool(shutdown)],
      caller,
    ).result;
  }

  setShutdownWithdraw(caller: string, shutdown: boolean): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-btc-v3",
      "set-shutdown-withdraw",
      [Cl.bool(shutdown)],
      caller,
    ).result;
  }

  setStackFee(caller: string, fee: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-btc-v3",
      "set-stack-fee",
      [Cl.uint(fee)],
      caller,
    ).result;
  }

  setUnstackFee(caller: string, fee: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-btc-v3",
      "set-unstack-fee",
      [Cl.uint(fee)],
      caller,
    ).result;
  }

  setWithdrawIdleFee(caller: string, fee: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-btc-v3",
      "set-withdraw-idle-fee",
      [Cl.uint(fee)],
      caller,
    ).result;
  }
}
