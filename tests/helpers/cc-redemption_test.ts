import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { qualifiedName, uintWithDecimals } from "../wrappers/tests-utils";
import { Reserve } from "../wrappers/reserve-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

//-------------------------------------
// Core
//-------------------------------------

describe("cc-redemption", () => {
  it("cc-redemption: deposit and withdraw for normal stacking", () => {
    const reserve = new Reserve(deployer);

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(0));

    const { result } = simnet.callPublicFn(
      "stacking-dao-core-v2",
      "deposit",
      [
        Cl.principal(qualifiedName("reserve-v1")),
        Cl.principal(qualifiedName("commission-v2")),
        Cl.principal(qualifiedName("staking-v1")),
        Cl.principal(qualifiedName("direct-helpers-v2")),
        Cl.uint(100 * 1_000_000),
        Cl.none(),
        Cl.none(),
      ],
      deployer,
    );
    expect(result).toBeOk(uintWithDecimals(100));

    expect(reserve.getTotalStx()).toBeOk(uintWithDecimals(100));
  });
});
