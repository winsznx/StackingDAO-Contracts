import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// Strategy V0
// ---------------------------------------------------------

export class StrategyV0 {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getLastCyclePerformed(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v0", "get-last-cycle-performed", [], this.deployer).result;
  }

  getPoxRewardAddress(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v0", "get-pox-reward-address", [], this.deployer).result;
  }

  getPoxCycle(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v0", "get-pox-cycle", [], this.deployer).result;
  }

  getNextCycleStartBurnHeight(): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v0",
      "get-next-cycle-start-burn-height",
      [],
      this.deployer,
    ).result;
  }

  getTotalStacking(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v0", "get-total-stacking", [], this.deployer).result;
  }

  getInflowOutflow(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v0", "get-outflow-inflow", [], this.deployer).result;
  }

  stackersGetTotalStacking(stackerId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v0",
      "stackers-get-total-stacking",
      [Cl.uint(stackerId)],
      this.deployer,
    ).result;
  }

  setPoxRewardAddress(caller: string, version: Uint8Array, hashbytes: Uint8Array): ClarityValue {
    return simnet.callPublicFn(
      "strategy-v0",
      "set-pox-reward-address",
      [Cl.tuple({ version: Cl.buffer(version), hashbytes: Cl.buffer(hashbytes) })],
      caller,
    ).result;
  }

  performInflow(caller: string, stackingAmounts: number[]): ClarityValue {
    return simnet.callPublicFn(
      "strategy-v0",
      "perform-inflow",
      [Cl.list(stackingAmounts.map((a) => Cl.uint(a * 1_000_000)))],
      caller,
    ).result;
  }

  performOutflow(caller: string, stackersToStop: boolean[]): ClarityValue {
    return simnet.callPublicFn(
      "strategy-v0",
      "perform-outflow",
      [Cl.list(stackersToStop.map((b) => Cl.bool(b)))],
      caller,
    ).result;
  }

  stackersReturnStx(caller: string): ClarityValue {
    return simnet.callPublicFn("strategy-v0", "stackers-return-stx", [], caller).result;
  }
}

// ---------------------------------------------------------
// Strategy V1
// ---------------------------------------------------------

export class StrategyV1 {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getLastCyclePerformed(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v1", "get-last-cycle-performed", [], this.deployer).result;
  }

  getPoxRewardAddress(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v1", "get-pox-reward-address", [], this.deployer).result;
  }

  getPoxCycle(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v1", "get-pox-cycle", [], this.deployer).result;
  }

  getNextCycleStartBurnHeight(): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v1",
      "get-next-cycle-start-burn-height",
      [],
      this.deployer,
    ).result;
  }

  getStackingMinimum(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v1", "get-stacking-minimum", [], this.deployer).result;
  }

  getPrepareCycleLength(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v1", "get-prepare-cycle-length", [], this.deployer).result;
  }

  getTotalStacking(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v1", "get-total-stacking", [], this.deployer).result;
  }

  getInflowOutflow(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v1", "get-outflow-inflow", [], this.deployer).result;
  }

  calculateInflow(inflow: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v1",
      "calculate-inflow",
      [Cl.uint(inflow * 1_000_000)],
      this.deployer,
    ).result;
  }

  calculateOutflow(outflow: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v1",
      "calculate-outflow",
      [Cl.uint(outflow * 1_000_000)],
      this.deployer,
    ).result;
  }

  stackersGetTotalStacking(stackerId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v1",
      "stackers-get-total-stacking",
      [Cl.uint(stackerId)],
      this.deployer,
    ).result;
  }

  setPoxRewardAddress(caller: string, version: Uint8Array, hashbytes: Uint8Array): ClarityValue {
    return simnet.callPublicFn(
      "strategy-v1",
      "set-pox-reward-address",
      [Cl.tuple({ version: Cl.buffer(version), hashbytes: Cl.buffer(hashbytes) })],
      caller,
    ).result;
  }

  performStacking(caller: string): ClarityValue {
    return simnet.callPublicFn("strategy-v1", "perform-stacking", [], caller).result;
  }

  performInflow(caller: string, stackingAmounts: number[]): ClarityValue {
    return simnet.callPublicFn(
      "strategy-v1",
      "perform-inflow",
      [Cl.list(stackingAmounts.map((a) => Cl.uint(a * 1_000_000)))],
      caller,
    ).result;
  }

  performOutflow(caller: string, stackersToStop: boolean[]): ClarityValue {
    return simnet.callPublicFn(
      "strategy-v1",
      "perform-outflow",
      [Cl.list(stackersToStop.map((b) => Cl.bool(b)))],
      caller,
    ).result;
  }

  stackersReturnStx(caller: string): ClarityValue {
    return simnet.callPublicFn("strategy-v1", "stackers-return-stx", [], caller).result;
  }
}

// ---------------------------------------------------------
// Strategy V2
// ---------------------------------------------------------

export class StrategyV2 {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getTotalStacking(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v2", "get-total-stacking", [], this.deployer).result;
  }

  getInflowOutflow(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v2", "get-outflow-inflow", [], this.deployer).result;
  }

  performPoolDelegation(
    caller: string,
    pool: string,
    delegatesInfo: { delegate: string; amount: number }[],
  ): ClarityValue {
    return simnet.callPublicFn(
      "strategy-v2",
      "perform-pool-delegation",
      [
        Cl.principal(pool),
        Cl.list(
          delegatesInfo.map((info) =>
            Cl.tuple({
              delegate: Cl.principal(info.delegate),
              amount: Cl.uint(info.amount * 1_000_000),
            }),
          ),
        ),
      ],
      caller,
    ).result;
  }
}

// ---------------------------------------------------------
// Strategy V3
// ---------------------------------------------------------

export class StrategyV3 {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getCyclePreparedPools(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v3", "get-cycle-prepared-pools", [], this.deployer).result;
  }

  getPreparePoolsData(pool: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v3",
      "get-prepare-pools-data",
      [Cl.principal(pool)],
      this.deployer,
    ).result;
  }

  getPrepareDelegatesData(delegate: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v3",
      "get-prepare-delegates-data",
      [Cl.principal(delegate)],
      this.deployer,
    ).result;
  }

  preparePools(caller: string): ClarityValue {
    return simnet.callPublicFn("strategy-v3", "prepare-pools", [], caller).result;
  }

  prepareDelegates(caller: string, pool: string): ClarityValue {
    return simnet.callPublicFn(
      "strategy-v3",
      "prepare-delegates",
      [Cl.principal(pool)],
      caller,
    ).result;
  }

  execute(caller: string, pool: string, delegates: string[]): ClarityValue {
    return simnet.callPublicFn(
      "strategy-v3",
      "execute",
      [
        Cl.principal(pool),
        Cl.list(delegates.map((d) => Cl.principal(d))),
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("rewards-v2")),
      ],
      caller,
    ).result;
  }

  returnUnlockedStx(caller: string, delegates: string[]): ClarityValue {
    return simnet.callPublicFn(
      "strategy-v3",
      "return-unlocked-stx",
      [
        Cl.list(delegates.map((d) => Cl.principal(d))),
        Cl.principal(qualifiedName("reserve-v1")),
      ],
      caller,
    ).result;
  }
}

// ---------------------------------------------------------
// Strategy V3 - Algo V1
// ---------------------------------------------------------

export class StrategyV3AlgoV1 {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  calculateLowestCombination(outflow: number, locked: number[]): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v3-algo-v1",
      "calculate-lowest-combination",
      [
        Cl.uint(outflow * 1_000_000),
        Cl.list(locked.map((l) => Cl.uint(l * 1_000_000))),
      ],
      this.deployer,
    ).result;
  }

  calculateReachTarget(target: number[], locked: number[]): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v3-algo-v1",
      "calculate-reach-target",
      [
        Cl.list(target.map((t) => Cl.uint(t * 1_000_000))),
        Cl.list(locked.map((l) => Cl.uint(l * 1_000_000))),
      ],
      this.deployer,
    ).result;
  }
}

// ---------------------------------------------------------
// Strategy V3 - Pools V1
// ---------------------------------------------------------

export class StrategyV3PoolsV1 {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  calculateNewAmounts(): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v3-pools-v1",
      "calculate-new-amounts",
      [],
      this.deployer,
    ).result;
  }

  calculateStackingPerPool(): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v3-pools-v1",
      "calculate-stacking-per-pool",
      [],
      this.deployer,
    ).result;
  }

  calculateStackingTargetForPool(
    pool: string,
    newTotalNormalStacking: number,
    newTotalDirectStacking: number,
  ): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v3-pools-v1",
      "calculate-stacking-target-for-pool",
      [
        Cl.principal(pool),
        Cl.uint(newTotalNormalStacking * 1_000_000),
        Cl.uint(newTotalDirectStacking * 1_000_000),
      ],
      this.deployer,
    ).result;
  }
}

// ---------------------------------------------------------
// Strategy V3 - Delegates V1
// ---------------------------------------------------------

export class StrategyV3DelegatesV1 {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  calculateStackingPerDelegate(pool: string, totalToStack: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v3-delegates-v1",
      "calculate-stacking-per-delegate",
      [Cl.principal(pool), Cl.uint(totalToStack * 1_000_000)],
      this.deployer,
    ).result;
  }

  calculateLockedForPool(pool: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "strategy-v3-delegates-v1",
      "calculate-locked-for-pool",
      [Cl.principal(pool)],
      this.deployer,
    ).result;
  }
}

// ---------------------------------------------------------
// Strategy V4
// ---------------------------------------------------------

export class StrategyV4 {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getManager(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v4", "get-manager", [], this.deployer).result;
  }

  getTotalStacking(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v4", "get-total-stacking", [], this.deployer).result;
  }

  getInflowOutflow(): ClarityValue {
    return simnet.callReadOnlyFn("strategy-v4", "get-outflow-inflow", [], this.deployer).result;
  }

  performPoolDelegation(
    caller: string,
    pool: string,
    delegatesInfo: { delegate: string; amount: number }[],
  ): ClarityValue {
    return simnet.callPublicFn(
      "strategy-v4",
      "perform-pool-delegation",
      [
        Cl.principal(pool),
        Cl.list(
          delegatesInfo.map((info) =>
            Cl.tuple({
              delegate: Cl.principal(info.delegate),
              amount: Cl.uint(info.amount * 1_000_000),
            }),
          ),
        ),
      ],
      caller,
    ).result;
  }

  setManager(caller: string, manager: string): ClarityValue {
    return simnet.callPublicFn(
      "strategy-v4",
      "set-manager",
      [Cl.principal(manager)],
      caller,
    ).result;
  }
}
