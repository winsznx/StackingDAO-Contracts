import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// Fomo
// ---------------------------------------------------------

export class Fomo {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getCurrentWinner(): ClarityValue {
    return simnet.callReadOnlyFn("fomo", "get-current-winner", [], this.deployer).result;
  }

  getClaimCost(): ClarityValue {
    return simnet.callReadOnlyFn("fomo", "get-claim-cost", [], this.deployer).result;
  }

  getIncrement(): ClarityValue {
    return simnet.callReadOnlyFn("fomo", "get-increment", [], this.deployer).result;
  }

  hasGameEnded(): ClarityValue {
    return simnet.callReadOnlyFn("fomo", "has-game-ended", [], this.deployer).result;
  }

  setClaimCost(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "fomo",
      "set-claim-cost",
      [Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  setIncrement(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "fomo",
      "set-increment",
      [Cl.uint(amount * 1_000_000)],
      caller,
    ).result;
  }

  buyClaim(caller: string): ClarityValue {
    return simnet.callPublicFn("fomo", "buy-claim", [], caller).result;
  }

  retrieveWinner(caller: string, nftId: number): ClarityValue {
    return simnet.callPublicFn("fomo", "retrieve-winner", [Cl.uint(nftId)], caller).result;
  }

  retrieveLoser(caller: string, nftId: number): ClarityValue {
    return simnet.callPublicFn("fomo", "retrieve-loser", [Cl.uint(nftId)], caller).result;
  }

  retrieveFees(caller: string): ClarityValue {
    return simnet.callPublicFn("fomo", "retrieve-fees", [], caller).result;
  }

  rescueFunds(caller: string): ClarityValue {
    return simnet.callPublicFn("fomo", "rescue-funds", [], caller).result;
  }

  startGame(caller: string): ClarityValue {
    return simnet.callPublicFn("fomo", "start-game", [], caller).result;
  }
}
