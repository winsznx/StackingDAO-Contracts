import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// Stacking Rewards Job
// ---------------------------------------------------------

export class RewardsJob {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  checkJob(): ClarityValue {
    return simnet.callReadOnlyFn(
      "rewards-job-v1",
      "check-job",
      [],
      this.deployer,
    ).result;
  }

  runJob(caller: string): ClarityValue {
    return simnet.callPublicFn("rewards-job-v1", "run-job", [], caller).result;
  }

  retreiveStxTokens(caller: string, amount: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "rewards-job-v1",
      "retreive-stx-tokens",
      [Cl.uint(amount * 1_000_000), Cl.principal(receiver)],
      caller,
    ).result;
  }
}
