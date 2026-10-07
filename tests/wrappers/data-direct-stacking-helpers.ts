import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// Data Direct Stacking
// ---------------------------------------------------------

export class DataDirectStacking {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getDirectStackingDependence(): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-direct-stacking-v1",
      "get-direct-stacking-dependence",
      [],
      this.deployer,
    ).result;
  }

  getTotalDirectStacking(): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-direct-stacking-v1",
      "get-total-direct-stacking",
      [],
      this.deployer,
    ).result;
  }

  getDirectStackingPoolAmount(pool: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-direct-stacking-v1",
      "get-direct-stacking-pool-amount",
      [Cl.principal(pool)],
      this.deployer,
    ).result;
  }

  getDirectStackingUser(user: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-direct-stacking-v1",
      "get-direct-stacking-user",
      [Cl.principal(user)],
      this.deployer,
    ).result;
  }

  setDirectStackingDependence(caller: string, dependence: number): ClarityValue {
    return simnet.callPublicFn(
      "data-direct-stacking-v1",
      "set-direct-stacking-dependence",
      [Cl.uint(dependence)],
      caller,
    ).result;
  }

  setTotalDirectStacking(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "data-direct-stacking-v1",
      "set-total-direct-stacking",
      [Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  setDirectStackingPoolAmount(caller: string, pool: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "data-direct-stacking-v1",
      "set-direct-stacking-pool-amount",
      [Cl.principal(pool), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  setDirectStackingUser(
    caller: string,
    user: string,
    pool: string,
    amount: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "data-direct-stacking-v1",
      "set-direct-stacking-user",
      [Cl.principal(user), Cl.principal(pool), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  deleteDirectStackingUser(caller: string, user: string): ClarityValue {
    return simnet.callPublicFn(
      "data-direct-stacking-v1",
      "delete-direct-stacking-user",
      [Cl.principal(user)],
      caller,
    ).result;
  }

  getSupportedProtocols(): ClarityValue {
    return simnet.callReadOnlyFn(
      "data-direct-stacking-v1",
      "get-supported-protocols",
      [],
      this.deployer,
    ).result;
  }

  setSupportedProtocols(caller: string, protocols: string[]): ClarityValue {
    return simnet.callPublicFn(
      "data-direct-stacking-v1",
      "set-supported-protocols",
      [Cl.list(protocols.map((protocol) => Cl.principal(protocol)))],
      caller,
    ).result;
  }
}
