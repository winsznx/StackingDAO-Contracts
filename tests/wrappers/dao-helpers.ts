import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// DAO
// ---------------------------------------------------------

export class DAO {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getContractsEnabled(): ClarityValue {
    return simnet.callReadOnlyFn("dao", "get-contracts-enabled", [], this.deployer).result;
  }

  getContractActive(address: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "dao",
      "get-contract-active",
      [Cl.principal(address)],
      this.deployer,
    ).result;
  }

  getAdmin(address: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "dao",
      "get-admin",
      [Cl.principal(address)],
      this.deployer,
    ).result;
  }

  checkIsEnabled(caller: string): ClarityValue {
    return simnet.callPublicFn("dao", "check-is-enabled", [], caller).result;
  }

  checkIsProtocol(caller: string, address: string): ClarityValue {
    return simnet.callPublicFn(
      "dao",
      "check-is-protocol",
      [Cl.principal(address)],
      caller,
    ).result;
  }

  checkIsAdmin(caller: string, address: string): ClarityValue {
    return simnet.callPublicFn(
      "dao",
      "check-is-admin",
      [Cl.principal(address)],
      caller,
    ).result;
  }

  setContractsEnabled(caller: string, enabled: boolean): ClarityValue {
    return simnet.callPublicFn(
      "dao",
      "set-contracts-enabled",
      [Cl.bool(enabled)],
      caller,
    ).result;
  }

  setContractActive(caller: string, address: string, active: boolean): ClarityValue {
    return simnet.callPublicFn(
      "dao",
      "set-contract-active",
      [Cl.principal(address), Cl.bool(active)],
      caller,
    ).result;
  }

  setAdmin(caller: string, address: string, active: boolean): ClarityValue {
    return simnet.callPublicFn(
      "dao",
      "set-admin",
      [Cl.principal(address), Cl.bool(active)],
      caller,
    ).result;
  }
}
