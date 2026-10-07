import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { qualifiedName, uintWithDecimals } from "../wrappers/tests-utils";
import { StStxWithdrawNft } from "../wrappers/ststx-withdraw-nft-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;

//-------------------------------------
// Getters
//-------------------------------------

describe("ststx-withdraw-nft", () => {
  it("ststx-withdraw-nft: can get token info", () => {
    const stStxWithdrawNft = new StStxWithdrawNft(deployer);

    expect(stStxWithdrawNft.getBaseUri()).toBeAscii("ipfs://");

    expect(stStxWithdrawNft.getLastTokenId()).toBeOk(Cl.uint(100000));

    expect(stStxWithdrawNft.getOwner(69)).toBeOk(Cl.none());

    expect(stStxWithdrawNft.getTokenUri(420)).toBeOk(
      Cl.some(Cl.stringAscii("ipfs://420.json")),
    );
  });

  //-------------------------------------
  // Mint / Burn
  //-------------------------------------

  it("ststx-withdraw-nft: can mint/burn as protocol", () => {
    const stStxWithdrawNft = new StStxWithdrawNft(deployer);

    expect(stStxWithdrawNft.getLastTokenId()).toBeOk(Cl.uint(100000));

    expect(stStxWithdrawNft.getOwner(0)).toBeOk(Cl.none());

    expect(stStxWithdrawNft.mintForProtocol(deployer, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxWithdrawNft.getLastTokenId()).toBeOk(Cl.uint(100000 + 1));

    expect(stStxWithdrawNft.getOwner(100000)).toBeOk(Cl.some(Cl.principal(wallet_1)));

    expect(stStxWithdrawNft.burnForProtocol(deployer, 100000)).toBeOk(Cl.bool(true));

    expect(stStxWithdrawNft.getLastTokenId()).toBeOk(Cl.uint(100000 + 1));

    expect(stStxWithdrawNft.getOwner(100000)).toBeOk(Cl.none());
  });

  //-------------------------------------
  // Transfer
  //-------------------------------------

  it("ststx-withdraw-nft: can transfer token", () => {
    const stStxWithdrawNft = new StStxWithdrawNft(deployer);

    expect(stStxWithdrawNft.getBalance(wallet_1)).toBeUint(0);

    expect(stStxWithdrawNft.mintForProtocol(deployer, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxWithdrawNft.getBalance(wallet_1)).toBeUint(1);

    expect(stStxWithdrawNft.getBalance(wallet_2)).toBeUint(0);

    expect(stStxWithdrawNft.transfer(wallet_1, 100000, wallet_2)).toBeOk(Cl.bool(true));

    expect(stStxWithdrawNft.getBalance(wallet_1)).toBeUint(0);

    expect(stStxWithdrawNft.getBalance(wallet_2)).toBeUint(1);

    expect(stStxWithdrawNft.getLastTokenId()).toBeOk(Cl.uint(100000 + 1));

    expect(stStxWithdrawNft.getOwner(100000)).toBeOk(Cl.some(Cl.principal(wallet_2)));
  });

  //-------------------------------------
  // Marketplace
  //-------------------------------------

  it("ststx-withdraw-nft: can list/unlist and buy on marketplace", () => {
    const stStxWithdrawNft = new StStxWithdrawNft(deployer);

    expect(stStxWithdrawNft.mintForProtocol(deployer, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxWithdrawNft.listInUstx(wallet_1, 100000, 10)).toBeOk(Cl.bool(true));

    expect(stStxWithdrawNft.getListingInUstx(100000)).toBeSome(
      Cl.tuple({
        commission: Cl.principal(qualifiedName("marketplace-commission")),
        price: uintWithDecimals(10),
      }),
    );

    // Can not transfer while listed
    expect(stStxWithdrawNft.transfer(wallet_1, 100000, wallet_2)).toBeErr(Cl.uint(1106));

    expect(stStxWithdrawNft.unlistInUstx(wallet_1, 100000)).toBeOk(Cl.bool(true));

    expect(stStxWithdrawNft.getListingInUstx(100000)).toBeNone();

    expect(stStxWithdrawNft.listInUstx(wallet_1, 100000, 20)).toBeOk(Cl.bool(true));

    expect(stStxWithdrawNft.buyInUstx(deployer, 100000)).toBeOk(Cl.bool(true));

    expect(stStxWithdrawNft.getListingInUstx(100000)).toBeNone();

    expect(stStxWithdrawNft.getBalance(deployer)).toBeUint(1);
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("ststx-withdraw-nft: can set base URI", () => {
    const stStxWithdrawNft = new StStxWithdrawNft(deployer);

    expect(stStxWithdrawNft.getBaseUri()).toBeAscii("ipfs://");

    expect(stStxWithdrawNft.getTokenUri(420)).toBeOk(
      Cl.some(Cl.stringAscii("ipfs://420.json")),
    );

    expect(stStxWithdrawNft.setBaseUri(deployer, "ipfs://123/")).toBeOk(Cl.bool(true));

    expect(stStxWithdrawNft.getBaseUri()).toBeAscii("ipfs://123/");

    expect(stStxWithdrawNft.getTokenUri(420)).toBeOk(
      Cl.some(Cl.stringAscii("ipfs://123/420.json")),
    );
  });

  //-------------------------------------
  // Error
  //-------------------------------------

  it("ststx-withdraw-nft: can not transfer is sender is not tx-sender", () => {
    const stStxWithdrawNft = new StStxWithdrawNft(deployer);

    expect(stStxWithdrawNft.mintForProtocol(deployer, deployer)).toBeOk(Cl.bool(true));

    const { result } = simnet.callPublicFn(
      "ststx-withdraw-nft",
      "transfer",
      [Cl.uint(0), Cl.principal(wallet_1), Cl.principal(wallet_2)],
      deployer,
    );
    expect(result).toBeErr(Cl.uint(1101));
  });

  it("ststx-withdraw-nft: can not burn NFT for which no owner found", () => {
    const stStxWithdrawNft = new StStxWithdrawNft(deployer);

    expect(stStxWithdrawNft.burnForProtocol(deployer, 10)).toBeErr(Cl.uint(1107));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("ststx-withdraw-nft: only protocol can set base URI, mint and burn for protocol", () => {
    const stStxWithdrawNft = new StStxWithdrawNft(deployer);

    expect(stStxWithdrawNft.mintForProtocol(deployer, deployer)).toBeOk(Cl.bool(true));

    expect(stStxWithdrawNft.setBaseUri(wallet_1, "test-uri")).toBeErr(Cl.uint(20003));

    expect(stStxWithdrawNft.mintForProtocol(wallet_1, wallet_1)).toBeErr(Cl.uint(20003));

    expect(stStxWithdrawNft.burnForProtocol(wallet_1, 100000)).toBeErr(Cl.uint(20003));
  });
});
