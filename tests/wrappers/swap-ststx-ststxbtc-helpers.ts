import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// Swap stSTX / stSTXbtc
// ---------------------------------------------------------

export class SwapStStxBtc {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  swapStStxForStStxBtc(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "swap-ststx-ststxbtc-v2",
      "swap-ststx-for-ststxbtc",
      [Cl.uint(amount * 1_000_000), Cl.principal(qualifiedName("reserve-v1"))],
      caller,
    ).result;
  }

  swapStStxBtcForStStx(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "swap-ststx-ststxbtc-v2",
      "swap-ststxbtc-for-ststx",
      [Cl.uint(amount * 1_000_000), Cl.principal(qualifiedName("reserve-v1"))],
      caller,
    ).result;
  }
}
