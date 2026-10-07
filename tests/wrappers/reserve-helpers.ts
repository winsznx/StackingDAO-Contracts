import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// Reserve
// ---------------------------------------------------------

export class Reserve {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getStxForWithdrawals(): ClarityValue {
    return simnet.callReadOnlyFn("reserve-v1", "get-stx-for-withdrawals", [], this.deployer).result;
  }

  getStxStacking(): ClarityValue {
    return simnet.callReadOnlyFn("reserve-v1", "get-stx-stacking", [], this.deployer).result;
  }

  getStxStackingAtBlock(blockHeight: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "reserve-v1",
      "get-stx-stacking-at-block",
      [Cl.uint(blockHeight)],
      this.deployer,
    ).result;
  }

  getStxBalance(): ClarityValue {
    return simnet.callReadOnlyFn("reserve-v1", "get-stx-balance", [], this.deployer).result;
  }

  getTotalStx(): ClarityValue {
    return simnet.callReadOnlyFn("reserve-v1", "get-total-stx", [], this.deployer).result;
  }

  getShutdownEnabled(): ClarityValue {
    return simnet.callReadOnlyFn("reserve-v1", "get-shutdown-enabled", [], this.deployer).result;
  }

  lockStxForWithdrawal(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "reserve-v1",
      "lock-stx-for-withdrawal",
      [Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  requestStxForWithdrawal(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "reserve-v1",
      "request-stx-for-withdrawal",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }

  requestStxToStack(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "reserve-v1",
      "request-stx-to-stack",
      [Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  returnStxFromStacking(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "reserve-v1",
      "return-stx-from-stacking",
      [Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  getStx(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "reserve-v1",
      "get-stx",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }
}
