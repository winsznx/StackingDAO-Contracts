import { Cl, ClarityValue } from "@stacks/transactions";
import { hexToBytes, qualifiedName } from "./tests-utils";

const POX_ADDR = Cl.tuple({
  version: Cl.buffer(new Uint8Array([0x00])),
  hashbytes: Cl.buffer(hexToBytes("f632e6f9d29bfb07bc8948ca6e0dd09358f003ac")),
});

// ---------------------------------------------------------
// Stacker
// ---------------------------------------------------------

export class Stacker {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getStackingUnlockBurnHeight(stackerId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacker-" + stackerId,
      "get-stacking-unlock-burn-height",
      [],
      this.deployer,
    ).result;
  }

  getStackingStxStacked(stackerId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacker-" + stackerId,
      "get-stacking-stx-stacked",
      [],
      this.deployer,
    ).result;
  }

  getStxBalance(stackerId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacker-" + stackerId,
      "get-stx-balance",
      [],
      this.deployer,
    ).result;
  }

  getStxStacked(stackerId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacker-" + stackerId,
      "get-stx-stacked",
      [],
      this.deployer,
    ).result;
  }

  getStackerInfo(stackerId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacker-" + stackerId,
      "get-stacker-info",
      [],
      this.deployer,
    ).result;
  }

  getStxAccount(stackerId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacker-" + stackerId,
      "get-stx-account",
      [],
      this.deployer,
    ).result;
  }

  getPoxInfo(stackerId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacker-" + stackerId,
      "get-pox-info",
      [],
      this.deployer,
    ).result;
  }

  initiateStacking(
    stackerId: number,
    caller: string,
    amount: number,
    startBurnHeight: number,
    lockPeriod: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "stacker-" + stackerId,
      "initiate-stacking",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        POX_ADDR,
        Cl.uint(amount * 1_000_000),
        Cl.uint(startBurnHeight),
        Cl.uint(lockPeriod),
      ],
      caller,
    ).result;
  }

  stackIncrease(stackerId: number, caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "stacker-" + stackerId,
      "stack-increase",
      [Cl.principal(qualifiedName("reserve-v1")), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  stackExtend(stackerId: number, caller: string, extendCount: number): ClarityValue {
    return simnet.callPublicFn(
      "stacker-" + stackerId,
      "stack-extend",
      [Cl.uint(extendCount), POX_ADDR],
      caller,
    ).result;
  }

  returnStx(stackerId: number, caller: string): ClarityValue {
    return simnet.callPublicFn(
      "stacker-" + stackerId,
      "return-stx",
      [Cl.principal(qualifiedName("reserve-v1"))],
      caller,
    ).result;
  }
}
