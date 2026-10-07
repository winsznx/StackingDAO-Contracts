import { ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// Return STX Job
// ---------------------------------------------------------

export class ReturnStxJob {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  checkJob(): ClarityValue {
    return simnet.callReadOnlyFn(
      "return-stx-job-v1",
      "check-job",
      [],
      this.deployer,
    ).result;
  }

  runJob(caller: string): ClarityValue {
    return simnet.callPublicFn("return-stx-job-v1", "run-job", [], caller).result;
  }
}
