import { Cl, ClarityValue } from "@stacks/transactions";
import { hexToBytes } from "./tests-utils";

const POX_ADDR = Cl.tuple({
  version: Cl.buffer(new Uint8Array([0x04])),
  hashbytes: Cl.buffer(hexToBytes("2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc")),
});

// ---------------------------------------------------------
// PoX-3 Mock
// ---------------------------------------------------------

export class Pox3Mock {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  burnHeightForRewardCycle(height: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "pox-3-mock",
      "burn-height-to-reward-cycle",
      [Cl.uint(height)],
      this.deployer,
    ).result;
  }

  getStackerInfo(stacker: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "pox-3-mock",
      "get-stacker-info",
      [Cl.principal(stacker)],
      this.deployer,
    ).result;
  }

  unlock(caller: string, account: string): ClarityValue {
    return simnet.callPublicFn(
      "pox-3-mock",
      "unlock-mock",
      [Cl.principal(account)],
      caller,
    ).result;
  }
}

// ---------------------------------------------------------
// PoX-4 Mock
// ---------------------------------------------------------

export class Pox4Mock {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getPoxInfo(): ClarityValue {
    return simnet.callReadOnlyFn("pox-4-mock", "get-pox-info", [], this.deployer).result;
  }

  burnHeightForRewardCycle(height: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "pox-4-mock",
      "burn-height-to-reward-cycle",
      [Cl.uint(height)],
      this.deployer,
    ).result;
  }

  getStackerInfo(stacker: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "pox-4-mock",
      "get-stacker-info",
      [Cl.principal(stacker)],
      this.deployer,
    ).result;
  }

  getCheckDelegation(stacker: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "pox-4-mock",
      "get-check-delegation",
      [Cl.principal(stacker)],
      this.deployer,
    ).result;
  }

  getPartialStackedByCycle(rewardCycle: number, pool: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "pox-4-mock",
      "get-partial-stacked-by-cycle",
      [POX_ADDR, Cl.uint(rewardCycle), Cl.principal(pool)],
      this.deployer,
    ).result;
  }

  getSignerKeyMessageHash(rewardCycle: number, topic: string, authId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "pox-4-mock",
      "get-signer-key-message-hash",
      [
        POX_ADDR,
        Cl.uint(rewardCycle),
        Cl.stringAscii(topic),
        Cl.uint(1),
        Cl.uint(999_999_999 * 1_000_000),
        Cl.uint(authId),
      ],
      this.deployer,
    ).result;
  }

  verifySignerKeySig(
    rewardCycle: number,
    topic: string,
    signerSig: string,
    signerKey: string,
    authId: number,
  ): ClarityValue {
    return simnet.callReadOnlyFn(
      "pox-4-mock",
      "verify-signer-key-sig",
      [
        POX_ADDR,
        Cl.uint(rewardCycle),
        Cl.stringAscii(topic),
        Cl.uint(1),
        Cl.some(Cl.buffer(hexToBytes(signerSig))),
        Cl.buffer(hexToBytes(signerKey)),
        Cl.uint(999_999_999 * 1_000_000),
        Cl.uint(999_999_999 * 1_000_000),
        Cl.uint(authId),
      ],
      this.deployer,
    ).result;
  }

  unlock(caller: string, account: string): ClarityValue {
    return simnet.callPublicFn(
      "pox-4-mock",
      "unlock-mock",
      [Cl.principal(account)],
      caller,
    ).result;
  }

  allowContractCaller(caller: string, contract: string): ClarityValue {
    return simnet.callPublicFn(
      "pox-4-mock",
      "allow-contract-caller",
      [Cl.principal(contract), Cl.none()],
      caller,
    ).result;
  }
}
