import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// Position Mock
// ---------------------------------------------------------

export class PositionMock {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getBalance(user: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "position-mock",
      "get-balance",
      [Cl.principal(user)],
      this.deployer,
    ).result;
  }

  setBalance(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "position-mock",
      "set-balance",
      [Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }
}
