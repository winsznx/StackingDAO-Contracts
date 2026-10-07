import { tx } from "@hirosystems/clarinet-sdk";
import { Cl, ClarityValue } from "@stacks/transactions";
import { hexToBytes } from "./tests-utils";

const POX_ADDR = Cl.tuple({
  version: Cl.buffer(new Uint8Array([0x04])),
  hashbytes: Cl.buffer(hexToBytes("2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc")),
});

const SIGNER_KEY = hexToBytes("0390a5cac7c33fda49f70bc1b0866fa0ba7a9440d9de647fecb8132ceb76a94dfa");

// ---------------------------------------------------------
// Stacking Pool Helpers
// ---------------------------------------------------------

export class StackingPool {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getPoxRewardAddress(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-pool-v1",
      "get-pox-reward-address",
      [],
      this.deployer,
    ).result;
  }

  getCycleToIndex(cycle: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-pool-v1",
      "get-cycle-to-index",
      [Cl.uint(cycle)],
      this.deployer,
    ).result;
  }

  prepare(caller: string): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-v1",
      "prepare-stacking-dao",
      [],
      caller,
    ).result;
  }

  delegateStx(caller: string, amount: number, untilBurnHeight: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-v1",
      "delegate-stx",
      [Cl.uint(amount * 1_000_000), Cl.some(Cl.uint(untilBurnHeight))],
      caller,
    ).result;
  }

  revokeDelegateStx(caller: string): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-v1",
      "revoke-delegate-stx",
      [],
      caller,
    ).result;
  }

  prepareDelegate(caller: string, delegate: string): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-v1",
      "prepare-delegate",
      [Cl.principal(delegate)],
      caller,
    ).result;
  }

  prepareDelegateMany(caller: string, delegates: string[]): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-v1",
      "prepare-delegate-many",
      [Cl.list(delegates.map((d) => Cl.principal(d)))],
      caller,
    ).result;
  }

  getStxAccount(account: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-pool-v1",
      "get-stx-account",
      [Cl.principal(account)],
      this.deployer,
    ).result;
  }

  notExtendedNextCycle(delegate: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-pool-v1",
      "not-extended-next-cycle",
      [Cl.principal(delegate)],
      this.deployer,
    ).result;
  }

  delegateStackStx(caller: string, stacker: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-v1",
      "delegate-stack-stx",
      [
        Cl.principal(stacker),
        Cl.uint(amount * 1_000_000),
        POX_ADDR,
        Cl.uint(0),
        Cl.uint(1),
      ],
      caller,
    ).result;
  }

  delegateStackExtend(caller: string, stacker: string): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-v1",
      "delegate-stack-extend",
      [Cl.principal(stacker), POX_ADDR, Cl.uint(1)],
      caller,
    ).result;
  }

  delegateStackIncrease(caller: string, stacker: string, increaseBy: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-v1",
      "delegate-stack-increase",
      [Cl.principal(stacker), POX_ADDR, Cl.uint(increaseBy * 1_000_000)],
      caller,
    ).result;
  }

  stackAggregationCommitIndexed(caller: string, rewardCycle: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-v1",
      "stack-aggregation-commit-indexed",
      [
        POX_ADDR,
        Cl.uint(rewardCycle),
        Cl.some(
          Cl.buffer(
            hexToBytes(
              "8803ef8561476ff1abf2f70d64b624de43e1d2dd9b115eb2ca5bafdf217b9b76378a195a6544e91bb2312b512c3f60ed64091ccee9db4f2e0bb8844fd0f1775d00",
            ),
          ),
        ),
        Cl.buffer(SIGNER_KEY),
        Cl.uint(999_999_999 * 1_000_000),
        Cl.uint(11),
      ],
      caller,
    ).result;
  }

  stackAggregationIncrease(caller: string, rewardCycle: number, rewardCycleIndex: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-v1",
      "stack-aggregation-increase",
      [
        POX_ADDR,
        Cl.uint(rewardCycle),
        Cl.uint(rewardCycleIndex),
        Cl.some(
          Cl.buffer(
            hexToBytes(
              "8803ef8561476ff1abf2f70d64b624de43e1d2dd9b115eb2ca5bafdf217b9b76378a195a6544e91bb2312b512c3f60ed64091ccee9db4f2e0bb8844fd0f1775d00",
            ),
          ),
        ),
        Cl.buffer(SIGNER_KEY),
        Cl.uint(999_999_999 * 1_000_000),
        Cl.uint(11),
      ],
      caller,
    ).result;
  }

  setPoxRewardAddress(caller: string, version: string, hashbytes: string): ClarityValue {
    return simnet.callPublicFn(
      "stacking-pool-v1",
      "set-pox-reward-address",
      [
        Cl.tuple({
          version: Cl.buffer(hexToBytes(version.replace(/^0x/, ""))),
          hashbytes: Cl.buffer(hexToBytes(hashbytes.replace(/^0x/, ""))),
        }),
      ],
      caller,
    ).result;
  }

  addSignatures(caller: string) {
    const block = simnet.mineBlock([
      tx.callPublicFn(
        "stacking-pool-v1",
        "set-cycle-signer-info",
        [
          Cl.uint(1),
          Cl.stringAscii("agg-commit"),
          POX_ADDR,
          Cl.uint(999_999_999 * 1_000_000),
          Cl.uint(11),
          Cl.buffer(SIGNER_KEY),
          Cl.buffer(
            hexToBytes(
              "8803ef8561476ff1abf2f70d64b624de43e1d2dd9b115eb2ca5bafdf217b9b76378a195a6544e91bb2312b512c3f60ed64091ccee9db4f2e0bb8844fd0f1775d00",
            ),
          ),
        ],
        caller,
      ),
      tx.callPublicFn(
        "stacking-pool-v1",
        "set-cycle-signer-info",
        [
          Cl.uint(2),
          Cl.stringAscii("agg-commit"),
          POX_ADDR,
          Cl.uint(999_999_999 * 1_000_000),
          Cl.uint(12),
          Cl.buffer(SIGNER_KEY),
          Cl.buffer(
            hexToBytes(
              "5bd19e251d47e84973ed396cd41b7d4406cfe91be067b66d1312124ab57bb0293fb174dc8cf1cd5471aae6c42c3e60e23274af81d8f64b159c3a63a84eb22fb400",
            ),
          ),
        ],
        caller,
      ),
      tx.callPublicFn(
        "stacking-pool-v1",
        "set-cycle-signer-info",
        [
          Cl.uint(3),
          Cl.stringAscii("agg-commit"),
          POX_ADDR,
          Cl.uint(999_999_999 * 1_000_000),
          Cl.uint(13),
          Cl.buffer(SIGNER_KEY),
          Cl.buffer(
            hexToBytes(
              "ace471e2af24af570f4d6ab55b299a3efc66e4887011e81606fc2f72793cc3ba45a47d55fbb03b5bc250afb16acf5c00d28c6de480699902f12e5fdfd901f30301",
            ),
          ),
        ],
        caller,
      ),
      tx.callPublicFn(
        "stacking-pool-v1",
        "set-cycle-signer-info",
        [
          Cl.uint(4),
          Cl.stringAscii("agg-commit"),
          POX_ADDR,
          Cl.uint(999_999_999 * 1_000_000),
          Cl.uint(14),
          Cl.buffer(SIGNER_KEY),
          Cl.buffer(
            hexToBytes(
              "42c937f82097157685cbc6f08ede067b46f5df238f71870975aa272ad035d9e25820c50d81f76275b9575e4c495cc0f27bd94d9a77d8d4c3451b3d9ebd52fa2e01",
            ),
          ),
        ],
        caller,
      ),
      tx.callPublicFn(
        "stacking-pool-v1",
        "set-cycle-signer-info",
        [
          Cl.uint(1),
          Cl.stringAscii("agg-increase"),
          POX_ADDR,
          Cl.uint(999_999_999 * 1_000_000),
          Cl.uint(21),
          Cl.buffer(SIGNER_KEY),
          Cl.buffer(
            hexToBytes(
              "182e988ea0bc8f9fe14209fc1d71e4aa7d07054e3eeb1146b7dcbabd3638d4a813cd9016d96f520cdda561b242f45014b594e4d3cb70e823ac5fe3e832607cab01",
            ),
          ),
        ],
        caller,
      ),
      tx.callPublicFn(
        "stacking-pool-v1",
        "set-cycle-signer-info",
        [
          Cl.uint(2),
          Cl.stringAscii("agg-increase"),
          POX_ADDR,
          Cl.uint(999_999_999 * 1_000_000),
          Cl.uint(22),
          Cl.buffer(SIGNER_KEY),
          Cl.buffer(
            hexToBytes(
              "b3eda0793c4f26954385cb5e29517c33ceb22283bdbfaf80e23fa79be5f83cfd21f0f67f2c895a4018f94349d7b7a108ff06178be3f5cc022659800151b90e6c01",
            ),
          ),
        ],
        caller,
      ),
    ]);
    for (const receipt of block) {
      if (receipt.result.type !== 7 /* ResponseOk */) {
        throw new Error(`addSignatures receipt failed: ${JSON.stringify(receipt.result)}`);
      }
    }
  }
}
