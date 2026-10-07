import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { qualifiedName } from "../wrappers/tests-utils";
import { DAO } from "../wrappers/dao-helpers";
import { Reserve } from "../wrappers/reserve-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;

//-------------------------------------
// Core
//-------------------------------------

describe("dao", () => {
  it("DAO: enable/disable contracts", () => {
    const dao = new DAO(deployer);
    const reserve = new Reserve(deployer);

    // Protocol is active
    expect(dao.getContractsEnabled()).toBeBool(true);

    expect(dao.checkIsEnabled(wallet_1)).toBeOk(Cl.bool(true));

    // Set protocol is inactive
    expect(dao.setContractsEnabled(deployer, false)).toBeOk(Cl.bool(true));

    expect(dao.getContractsEnabled()).toBeBool(false);

    expect(dao.checkIsEnabled(wallet_1)).toBeErr(Cl.uint(20002));

    // Can not call method
    expect(reserve.requestStxToStack(deployer, 10)).toBeErr(Cl.uint(20002));

    // Set protocol is active again
    expect(dao.setContractsEnabled(deployer, true)).toBeOk(Cl.bool(true));

    expect(dao.getContractsEnabled()).toBeBool(true);

    expect(dao.checkIsEnabled(wallet_1)).toBeOk(Cl.bool(true));
  });

  it("DAO: add or update protocol contracts", () => {
    const dao = new DAO(deployer);

    // Check active contracts
    expect(dao.getContractActive(qualifiedName("reserve-v1"))).toBeBool(true);

    expect(dao.getContractActive(qualifiedName("governance-v0"))).toBeBool(false);

    expect(dao.checkIsProtocol(deployer, qualifiedName("reserve-v1"))).toBeOk(Cl.bool(true));

    expect(dao.checkIsProtocol(deployer, qualifiedName("governance-v0"))).toBeErr(Cl.uint(20003));

    // Contract can not update protocol
    let result = simnet.callPublicFn(
      "governance-v0",
      "set-commission",
      [Cl.uint(10)],
      deployer,
    ).result;
    expect(result).toBeErr(Cl.uint(20003));

    // Deactivate contract
    expect(dao.setContractActive(deployer, qualifiedName("reserve-v1"), false)).toBeOk(Cl.bool(true));

    // Activate contract
    expect(dao.setContractActive(deployer, qualifiedName("governance-v0"), true)).toBeOk(Cl.bool(true));

    // Check
    expect(dao.checkIsProtocol(deployer, qualifiedName("reserve-v1"))).toBeErr(Cl.uint(20003));

    expect(dao.checkIsProtocol(deployer, qualifiedName("governance-v0"))).toBeOk(Cl.bool(true));

    // Contract can update protocol
    result = simnet.callPublicFn(
      "governance-v0",
      "set-commission",
      [Cl.uint(10)],
      deployer,
    ).result;
    expect(result).toBeOk(Cl.bool(true));
  });

  it("DAO: add or update protocol admins", () => {
    const dao = new DAO(deployer);

    // Check active guardian
    expect(dao.getAdmin(deployer)).toBeBool(true);

    expect(dao.getAdmin(wallet_1)).toBeBool(false);

    expect(dao.checkIsAdmin(deployer, deployer)).toBeOk(Cl.bool(true));

    expect(dao.checkIsAdmin(deployer, wallet_1)).toBeErr(Cl.uint(20001));

    // Activate new guardian
    expect(dao.setAdmin(deployer, wallet_1, true)).toBeOk(Cl.bool(true));

    // Deactivate guardian
    expect(dao.setAdmin(deployer, deployer, false)).toBeOk(Cl.bool(true));

    // Deployer not admin anymore
    expect(dao.setAdmin(deployer, deployer, false)).toBeErr(Cl.uint(20001));

    // Check
    expect(dao.checkIsAdmin(deployer, deployer)).toBeErr(Cl.uint(20001));

    expect(dao.checkIsAdmin(deployer, wallet_1)).toBeOk(Cl.bool(true));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("DAO: only protocol admin can enable/disable contracts", () => {
    const dao = new DAO(deployer);

    expect(dao.setContractsEnabled(wallet_1, false)).toBeErr(Cl.uint(20001));
  });

  it("DAO: only protocol admin can set contracts", () => {
    const dao = new DAO(deployer);

    expect(dao.setContractActive(wallet_1, wallet_1, true)).toBeErr(Cl.uint(20001));
  });
});
