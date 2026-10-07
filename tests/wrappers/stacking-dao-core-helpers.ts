import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// Core V1
// ---------------------------------------------------------

export class CoreV1 {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getCommission(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v1",
      "get-commission",
      [],
      this.deployer,
    ).result;
  }

  getShutdownDeposits(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v1",
      "get-shutdown-deposits",
      [],
      this.deployer,
    ).result;
  }

  getCycleInfo(cycle: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v1",
      "get-cycle-info",
      [Cl.uint(cycle)],
      this.deployer,
    ).result;
  }

  getWithdrawalsByNft(nftId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v1",
      "get-withdrawals-by-nft",
      [Cl.uint(nftId)],
      this.deployer,
    ).result;
  }

  getBurnHeight(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v1",
      "get-burn-height",
      [],
      this.deployer,
    ).result;
  }

  getPoxCycle(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v1",
      "get-pox-cycle",
      [],
      this.deployer,
    ).result;
  }

  getStxBalance(address: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v1",
      "get-stx-balance",
      [Cl.principal(address)],
      this.deployer,
    ).result;
  }

  getNextWithdrawCycle(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v1",
      "get-next-withdraw-cycle",
      [],
      this.deployer,
    ).result;
  }

  getStxPerStstx(): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v1",
      "get-stx-per-ststx",
      [Cl.principal(qualifiedName("reserve-v1"))],
      this.deployer,
    ).result;
  }

  deposit(caller: string, amount: number, referrer?: string): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v1",
      "deposit",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.uint(amount * 1_000_000),
        referrer ? Cl.some(Cl.principal(referrer)) : Cl.none(),
      ],
      caller,
    ).result;
  }

  initWithdraw(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v1",
      "init-withdraw",
      [Cl.principal(qualifiedName("reserve-v1")), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  withdraw(caller: string, nftId: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v1",
      "withdraw",
      [Cl.principal(qualifiedName("reserve-v1")), Cl.uint(nftId)],
      caller,
    ).result;
  }

  addRewards(caller: string, amount: number, cycle: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v1",
      "add-rewards",
      [
        Cl.principal(qualifiedName("commission-v1")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.uint(amount * 1_000_000),
        Cl.uint(cycle),
      ],
      caller,
    ).result;
  }

  setCommission(caller: string, commission: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v1",
      "set-commission",
      [Cl.uint(commission * 10_000)],
      caller,
    ).result;
  }

  setShutdownDeposits(caller: string, shutdown: boolean): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v1",
      "set-shutdown-deposits",
      [Cl.bool(shutdown)],
      caller,
    ).result;
  }
}

// ---------------------------------------------------------
// Core V6
// ---------------------------------------------------------

export class Core {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getShutdownDeposits(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v6",
      "get-shutdown-deposits",
      [],
      this.deployer,
    ).result;
  }

  getShutdownInitWithdraw(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v6",
      "get-shutdown-init-withdraw",
      [],
      this.deployer,
    ).result;
  }

  getShutdownWithdraw(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v6",
      "get-shutdown-withdraw",
      [],
      this.deployer,
    ).result;
  }

  getShutdownWithdrawIdle(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v6",
      "get-shutdown-withdraw-idle",
      [],
      this.deployer,
    ).result;
  }

  getWithdrawUnlockBurnHeight(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v6",
      "get-withdraw-unlock-burn-height",
      [],
      this.deployer,
    ).result;
  }

  getIdleCycle(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-core-v6",
      "get-idle-cycle",
      [],
      this.deployer,
    ).result;
  }

  deposit(
    caller: string,
    amount: number,
    referrer?: string,
    pool?: string,
  ): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v6",
      "deposit",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.principal(qualifiedName("direct-helpers-v4")),
        Cl.uint(amount * 1_000_000),
        referrer ? Cl.some(Cl.principal(referrer)) : Cl.none(),
        pool ? Cl.some(Cl.principal(pool)) : Cl.none(),
      ],
      caller,
    ).result;
  }

  withdrawIdle(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v6",
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
      "stacking-dao-core-v6",
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
      "stacking-dao-core-v6",
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
      "stacking-dao-core-v6",
      "set-shutdown-deposits",
      [Cl.bool(shutdown)],
      caller,
    ).result;
  }

  setShutdownInitWithdraw(caller: string, shutdown: boolean): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v6",
      "set-shutdown-init-withdraw",
      [Cl.bool(shutdown)],
      caller,
    ).result;
  }

  setShutdownWithdrawIdle(caller: string, shutdown: boolean): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v6",
      "set-shutdown-withdraw-idle",
      [Cl.bool(shutdown)],
      caller,
    ).result;
  }

  setShutdownWithdraw(caller: string, shutdown: boolean): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v6",
      "set-shutdown-withdraw",
      [Cl.bool(shutdown)],
      caller,
    ).result;
  }

  setStackFee(caller: string, fee: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v6",
      "set-stack-fee",
      [Cl.uint(fee)],
      caller,
    ).result;
  }

  setUnstackFee(caller: string, fee: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v6",
      "set-unstack-fee",
      [Cl.uint(fee)],
      caller,
    ).result;
  }

  setWithdrawIdleFee(caller: string, fee: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-core-v6",
      "set-withdraw-idle-fee",
      [Cl.uint(fee)],
      caller,
    ).result;
  }
}
