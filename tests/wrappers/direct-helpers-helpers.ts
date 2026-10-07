import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// Direct Helpers
// ---------------------------------------------------------

export class DirectHelpers {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  addDirectStacking(
    caller: string,
    user: string,
    pool: string | undefined,
    amount: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "direct-helpers-v4",
      "add-direct-stacking",
      [
        Cl.principal(user),
        pool == undefined ? Cl.none() : Cl.some(Cl.principal(pool)),
        Cl.uint(amount * 1_000_000),
      ],
      caller,
    ).result;
  }

  subtractDirectStacking(caller: string, user: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "direct-helpers-v4",
      "subtract-direct-stacking",
      [Cl.principal(user), Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  stopDirectStacking(caller: string, user: string): ClarityValue {
    return simnet.callPublicFn(
      "direct-helpers-v4",
      "stop-direct-stacking",
      [Cl.principal(user)],
      caller,
    ).result;
  }

  subtractDirectStackingUser(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "direct-helpers-v4",
      "subtract-direct-stacking-user",
      [Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  stopDirectStackingUser(caller: string): ClarityValue {
    return simnet.callPublicFn(
      "direct-helpers-v4",
      "stop-direct-stacking-user",
      [],
      caller,
    ).result;
  }

  calculateDirectStackingInfo(protocols: string[], user: string): ClarityValue {
    return simnet.callPublicFn(
      "direct-helpers-v4",
      "calculate-direct-stacking-info",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.list(protocols.map((protocol) => Cl.principal(protocol))),
        Cl.principal(user),
      ],
      this.deployer,
    ).result;
  }

  updateDirectStacking(caller: string, protocols: string[], user: string): ClarityValue {
    return simnet.callPublicFn(
      "direct-helpers-v4",
      "update-direct-stacking",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.list(protocols.map((protocol) => Cl.principal(protocol))),
        Cl.principal(user),
      ],
      caller,
    ).result;
  }
}
