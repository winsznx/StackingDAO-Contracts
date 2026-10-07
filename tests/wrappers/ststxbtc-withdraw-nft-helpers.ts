import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// stSTXbtc withdraw NFT
// ---------------------------------------------------------

export class StStxBtcWithdrawNft {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getBaseUri(): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "get-base-token-uri",
      [],
      this.deployer,
    ).result;
  }

  getBalance(account: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "get-balance",
      [Cl.principal(account)],
      this.deployer,
    ).result;
  }

  getListingInUstx(tokenId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "get-listing-in-ustx",
      [Cl.uint(tokenId)],
      this.deployer,
    ).result;
  }

  getLastTokenId(): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "get-last-token-id",
      [],
      this.deployer,
    ).result;
  }

  uintToString(): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "uint-to-string",
      [],
      this.deployer,
    ).result;
  }

  getTokenUri(tokenId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "get-token-uri",
      [Cl.uint(tokenId)],
      this.deployer,
    ).result;
  }

  getOwner(tokenId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "get-owner",
      [Cl.uint(tokenId)],
      this.deployer,
    ).result;
  }

  setBaseUri(caller: string, root: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-withdraw-nft",
      "set-base-token-uri",
      [Cl.stringAscii(root)],
      caller,
    ).result;
  }

  transfer(caller: string, tokenId: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-withdraw-nft",
      "transfer",
      [Cl.uint(tokenId), Cl.principal(caller), Cl.principal(receiver)],
      caller,
    ).result;
  }

  mintForProtocol(caller: string, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-withdraw-nft",
      "mint-for-protocol",
      [Cl.principal(receiver)],
      caller,
    ).result;
  }

  burnForProtocol(caller: string, tokenId: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-withdraw-nft",
      "burn-for-protocol",
      [Cl.uint(tokenId)],
      caller,
    ).result;
  }

  listInUstx(caller: string, tokenId: number, price: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-withdraw-nft",
      "list-in-ustx",
      [
        Cl.uint(tokenId),
        Cl.uint(price * 1_000_000),
        Cl.principal(qualifiedName("marketplace-commission")),
      ],
      caller,
    ).result;
  }

  unlistInUstx(caller: string, tokenId: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-withdraw-nft",
      "unlist-in-ustx",
      [Cl.uint(tokenId)],
      caller,
    ).result;
  }

  buyInUstx(caller: string, tokenId: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-withdraw-nft",
      "buy-in-ustx",
      [
        Cl.uint(tokenId),
        Cl.principal(qualifiedName("marketplace-commission")),
      ],
      caller,
    ).result;
  }
}
