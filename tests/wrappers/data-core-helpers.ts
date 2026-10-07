import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// Data Core
// ---------------------------------------------------------

export class DataCore {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getStxPerStStx(reserveContract: string): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v2",
      "get-stx-per-ststx",
      [Cl.principal(reserveContract)],
      this.deployer,
    ).result;
  }

  getStxPerStStxHelper(amount: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-core-v2",
      "get-stx-per-ststx-helper",
      [Cl.uint(amount * 1_000_000)],
      this.deployer,
    ).result;
  }

  getCycleWithdrawOffset(): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-core-v1",
      "get-cycle-withdraw-offset",
      [],
      this.deployer,
    ).result;
  }

  setCycleWithdrawOffset(caller: string, offset: number): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v1",
      "set-cycle-withdraw-offset",
      [Cl.uint(offset)],
      caller,
    ).result;
  }

  getMigratedNft(nftId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-core-v1",
      "get-migrated-nft",
      [Cl.uint(nftId)],
      this.deployer,
    ).result;
  }

  getWithdrawalsByNft(nftId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-core-v1",
      "get-withdrawals-by-nft",
      [Cl.uint(nftId)],
      this.deployer,
    ).result;
  }

  setWithdrawalsByNft(
    caller: string,
    nftId: number,
    stxAmount: number,
    stStxAmount: number,
    unlockBurnHeight: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v1",
      "set-withdrawals-by-nft",
      [
        Cl.uint(nftId),
        Cl.uint(stxAmount * 1_000_000),
        Cl.uint(stStxAmount * 1_000_000),
        Cl.uint(unlockBurnHeight),
      ],
      caller,
    ).result;
  }

  deleteWithdrawalsByNft(caller: string, nftId: number): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v1",
      "delete-withdrawals-by-nft",
      [Cl.uint(nftId)],
      caller,
    ).result;
  }

  getStStxBtcWithdrawalsByNft(nftId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-core-v2",
      "get-ststxbtc-withdrawals-by-nft",
      [Cl.uint(nftId)],
      this.deployer,
    ).result;
  }

  setStStxBtcWithdrawalsByNft(
    caller: string,
    nftId: number,
    stxAmount: number,
    stStxAmount: number,
    unlockBurnHeight: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v2",
      "set-ststxbtc-withdrawals-by-nft",
      [
        Cl.uint(nftId),
        Cl.uint(stxAmount * 1_000_000),
        Cl.uint(stStxAmount * 1_000_000),
        Cl.uint(unlockBurnHeight),
      ],
      caller,
    ).result;
  }

  deleteStStxBtcWWithdrawalsByNft(caller: string, nftId: number): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v2",
      "delete-ststxbtc-withdrawals-by-nft",
      [Cl.uint(nftId)],
      caller,
    ).result;
  }
}

// ---------------------------------------------------------
// Data Core
// ---------------------------------------------------------

export class DataCoreV2 {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getStxPerStStx(reserveContract: string): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v3",
      "get-stx-per-ststx",
      [Cl.principal(reserveContract)],
      this.deployer,
    ).result;
  }

  getStxPerStStxHelper(amount: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-core-v3",
      "get-stx-per-ststx-helper",
      [Cl.uint(amount * 1_000_000)],
      this.deployer,
    ).result;
  }

  getStStxBtcWithdrawalsByNft(nftId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-core-v2",
      "get-ststxbtc-withdrawals-by-nft",
      [Cl.uint(nftId)],
      this.deployer,
    ).result;
  }

  setStStxBtcWithdrawalsByNft(
    caller: string,
    nftId: number,
    stxAmount: number,
    unlockBurnHeight: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v2",
      "set-ststxbtc-withdrawals-by-nft",
      [
        Cl.uint(nftId),
        Cl.uint(stxAmount * 1_000_000),
        Cl.uint(unlockBurnHeight),
      ],
      caller,
    ).result;
  }

  deleteStStxBtcWWithdrawalsByNft(caller: string, nftId: number): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v2",
      "delete-ststxbtc-withdrawals-by-nft",
      [Cl.uint(nftId)],
      caller,
    ).result;
  }

  getCycleWithdrawInset(): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-core-v2",
      "get-cycle-withdraw-inset",
      [],
      this.deployer,
    ).result;
  }

  setCycleWithdrawInset(caller: string, inset: number): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v2",
      "set-cycle-withdraw-inset",
      [Cl.uint(inset)],
      caller,
    ).result;
  }

  getStxIdle(cycle: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-core-v2",
      "get-stx-idle",
      [Cl.uint(cycle)],
      this.deployer,
    ).result;
  }

  setStxIdle(caller: string, cycle: number, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v2",
      "set-stx-idle",
      [Cl.uint(cycle), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  increaseStxIdle(caller: string, cycle: number, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v2",
      "increase-stx-idle",
      [Cl.uint(cycle), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  decreaseStxIdle(caller: string, cycle: number, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "data-core-v2",
      "decrease-stx-idle",
      [Cl.uint(cycle), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }
}
