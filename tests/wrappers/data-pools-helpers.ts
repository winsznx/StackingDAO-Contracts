import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// Data Pools
// ---------------------------------------------------------

export class DataPools {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getStandardCommission(): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-pools-v1",
      "get-standard-commission",
      [],
      this.deployer,
    ).result;
  }

  getPoolCommission(pool: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-pools-v1",
      "get-pool-commission",
      [Cl.principal(pool)],
      this.deployer,
    ).result;
  }

  getPoolOwnerCommission(pool: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-pools-v1",
      "get-pool-owner-commission",
      [Cl.principal(pool)],
      this.deployer,
    ).result;
  }

  setStandardCommission(caller: string, commission: number): ClarityValue {
    return simnet.callPublicFn(
      "data-pools-v1",
      "set-standard-commission",
      [Cl.uint(commission)],
      caller,
    ).result;
  }

  setPoolCommission(caller: string, pool: string, commission: number): ClarityValue {
    return simnet.callPublicFn(
      "data-pools-v1",
      "set-pool-commission",
      [Cl.principal(pool), Cl.uint(commission)],
      caller,
    ).result;
  }

  setPoolOwnerCommission(
    caller: string,
    pool: string,
    receiver: string,
    share: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "data-pools-v1",
      "set-pool-owner-commission",
      [Cl.principal(pool), Cl.principal(receiver), Cl.uint(share * 10_000)],
      caller,
    ).result;
  }

  getActivePools(): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-pools-v1",
      "get-active-pools",
      [],
      this.deployer,
    ).result;
  }

  getPoolShare(pool: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-pools-v1",
      "get-pool-share",
      [Cl.principal(pool)],
      this.deployer,
    ).result;
  }

  getPoolDelegates(pool: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-pools-v1",
      "get-pool-delegates",
      [Cl.principal(pool)],
      this.deployer,
    ).result;
  }

  getDelegateShare(delegate: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-pools-v1",
      "get-delegate-share",
      [Cl.principal(delegate)],
      this.deployer,
    ).result;
  }

  setActivePools(caller: string, pools: string[]): ClarityValue {
    return simnet.callPublicFn(
      "data-pools-v1",
      "set-active-pools",
      [Cl.list(pools.map((pool) => Cl.principal(pool)))],
      caller,
    ).result;
  }

  setPoolShare(caller: string, pool: string, share: number): ClarityValue {
    return simnet.callPublicFn(
      "data-pools-v1",
      "set-pool-share",
      [Cl.principal(pool), Cl.uint(share)],
      caller,
    ).result;
  }

  setPoolDelegates(caller: string, pool: string, delegates: string[]): ClarityValue {
    return simnet.callPublicFn(
      "data-pools-v1",
      "set-pool-delegates",
      [
        Cl.principal(pool),
        Cl.list(delegates.map((delegate) => Cl.principal(delegate))),
      ],
      caller,
    ).result;
  }

  setDelegateShare(caller: string, delegate: string, share: number): ClarityValue {
    return simnet.callPublicFn(
      "data-pools-v1",
      "set-delegate-share",
      [Cl.principal(delegate), Cl.uint(share)],
      caller,
    ).result;
  }
}
