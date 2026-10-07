import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { qualifiedName, uintWithDecimals } from "../wrappers/tests-utils";
import { StStxBtcWithdrawNft } from "../wrappers/ststxbtc-withdraw-nft-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;

//-------------------------------------
// Getters
//-------------------------------------

describe("ststxbtc-withdraw-nft", () => {
  it("ststxbtc-withdraw-nft: can get token info", () => {
    const stStxBtcWithdrawNft = new StStxBtcWithdrawNft(deployer);

    expect(stStxBtcWithdrawNft.getBaseUri()).toBeAscii("ipfs://");

    expect(stStxBtcWithdrawNft.getLastTokenId()).toBeOk(Cl.uint(0));

    expect(stStxBtcWithdrawNft.getOwner(69)).toBeOk(Cl.none());

    expect(stStxBtcWithdrawNft.getTokenUri(420)).toBeOk(
      Cl.some(Cl.stringAscii("ipfs://420.json")),
    );
  });

  //-------------------------------------
  // Mint / Burn
  //-------------------------------------

  it("ststxbtc-withdraw-nft: can mint/burn as protocol", () => {
    const stStxBtcWithdrawNft = new StStxBtcWithdrawNft(deployer);

    expect(stStxBtcWithdrawNft.getLastTokenId()).toBeOk(Cl.uint(0));

    expect(stStxBtcWithdrawNft.getOwner(0)).toBeOk(Cl.none());

    expect(stStxBtcWithdrawNft.mintForProtocol(deployer, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.getLastTokenId()).toBeOk(Cl.uint(1));

    expect(stStxBtcWithdrawNft.getOwner(0)).toBeOk(Cl.some(Cl.principal(wallet_1)));

    expect(stStxBtcWithdrawNft.burnForProtocol(deployer, 0)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.getLastTokenId()).toBeOk(Cl.uint(1));

    expect(stStxBtcWithdrawNft.getOwner(1)).toBeOk(Cl.none());
  });

  //-------------------------------------
  // Transfer
  //-------------------------------------

  it("ststxbtc-withdraw-nft: can transfer token", () => {
    const stStxBtcWithdrawNft = new StStxBtcWithdrawNft(deployer);

    expect(stStxBtcWithdrawNft.getBalance(wallet_1)).toBeUint(0);

    expect(stStxBtcWithdrawNft.mintForProtocol(deployer, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.getBalance(wallet_1)).toBeUint(1);

    expect(stStxBtcWithdrawNft.getBalance(wallet_2)).toBeUint(0);

    expect(stStxBtcWithdrawNft.transfer(wallet_1, 0, wallet_2)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.getBalance(wallet_1)).toBeUint(0);

    expect(stStxBtcWithdrawNft.getBalance(wallet_2)).toBeUint(1);

    expect(stStxBtcWithdrawNft.getLastTokenId()).toBeOk(Cl.uint(1));

    expect(stStxBtcWithdrawNft.getOwner(0)).toBeOk(Cl.some(Cl.principal(wallet_2)));
  });

  //-------------------------------------
  // Marketplace
  //-------------------------------------

  it("ststxbtc-withdraw-nft: can list/unlist and buy on marketplace", () => {
    const stStxBtcWithdrawNft = new StStxBtcWithdrawNft(deployer);

    expect(stStxBtcWithdrawNft.mintForProtocol(deployer, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.listInUstx(wallet_1, 0, 10)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.getListingInUstx(0)).toBeSome(
      Cl.tuple({
        commission: Cl.principal(qualifiedName("marketplace-commission")),
        price: uintWithDecimals(10),
      }),
    );

    // Can not transfer while listed
    expect(stStxBtcWithdrawNft.transfer(wallet_1, 0, wallet_2)).toBeErr(Cl.uint(1106));

    expect(stStxBtcWithdrawNft.unlistInUstx(wallet_1, 0)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.getListingInUstx(0)).toBeNone();

    expect(stStxBtcWithdrawNft.listInUstx(wallet_1, 0, 20)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.buyInUstx(deployer, 0)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.getListingInUstx(0)).toBeNone();

    expect(stStxBtcWithdrawNft.getBalance(deployer)).toBeUint(1);
  });

  it("ststxbtc-withdraw-nft: will unlist on burn", () => {
    const stStxBtcWithdrawNft = new StStxBtcWithdrawNft(deployer);

    expect(stStxBtcWithdrawNft.mintForProtocol(deployer, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.listInUstx(wallet_1, 0, 10)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.getListingInUstx(0)).toBeSome(
      Cl.tuple({
        commission: Cl.principal(qualifiedName("marketplace-commission")),
        price: uintWithDecimals(10),
      }),
    );

    // Can not transfer while listed
    expect(stStxBtcWithdrawNft.burnForProtocol(deployer, 0)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.getListingInUstx(0)).toBeNone();
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("ststxbtc-withdraw-nft: can set base URI", () => {
    const stStxBtcWithdrawNft = new StStxBtcWithdrawNft(deployer);

    expect(stStxBtcWithdrawNft.getBaseUri()).toBeAscii("ipfs://");

    expect(stStxBtcWithdrawNft.getTokenUri(420)).toBeOk(
      Cl.some(Cl.stringAscii("ipfs://420.json")),
    );

    expect(stStxBtcWithdrawNft.setBaseUri(deployer, "ipfs://123/")).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.getBaseUri()).toBeAscii("ipfs://123/");

    expect(stStxBtcWithdrawNft.getTokenUri(420)).toBeOk(
      Cl.some(Cl.stringAscii("ipfs://123/420.json")),
    );
  });

  //-------------------------------------
  // Error
  //-------------------------------------

  it("ststxbtc-withdraw-nft: can not transfer is sender is not tx-sender", () => {
    const stStxBtcWithdrawNft = new StStxBtcWithdrawNft(deployer);

    expect(stStxBtcWithdrawNft.mintForProtocol(deployer, deployer)).toBeOk(Cl.bool(true));

    const { result } = simnet.callPublicFn(
      "ststx-withdraw-nft",
      "transfer",
      [Cl.uint(0), Cl.principal(wallet_1), Cl.principal(wallet_2)],
      deployer,
    );
    expect(result).toBeErr(Cl.uint(1101));
  });

  it("ststxbtc-withdraw-nft: can not burn NFT for which no owner found", () => {
    const stStxBtcWithdrawNft = new StStxBtcWithdrawNft(deployer);

    expect(stStxBtcWithdrawNft.burnForProtocol(deployer, 10)).toBeErr(Cl.uint(1107));
  });

  //-------------------------------------
  // Access
  //-------------------------------------

  it("ststxbtc-withdraw-nft: only protocol can set base URI, mint and burn for protocol", () => {
    const stStxBtcWithdrawNft = new StStxBtcWithdrawNft(deployer);

    expect(stStxBtcWithdrawNft.mintForProtocol(deployer, deployer)).toBeOk(Cl.bool(true));

    expect(stStxBtcWithdrawNft.setBaseUri(wallet_1, "test-uri")).toBeErr(Cl.uint(20003));

    expect(stStxBtcWithdrawNft.mintForProtocol(wallet_1, wallet_1)).toBeErr(Cl.uint(20003));

    expect(stStxBtcWithdrawNft.burnForProtocol(wallet_1, 0)).toBeErr(Cl.uint(20003));
  });
});
