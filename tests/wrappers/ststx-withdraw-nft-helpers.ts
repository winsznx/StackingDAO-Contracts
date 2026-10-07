import { Cl, ClarityValue } from "@stacks/transactions";
import { qualifiedName } from "./tests-utils";

// ---------------------------------------------------------
// stSTX withdraw NFT
// ---------------------------------------------------------

export class StStxWithdrawNft {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getBaseUri(): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "get-base-token-uri",
      [],
      this.deployer,
    ).result;
  }

  getBalance(account: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "get-balance",
      [Cl.principal(account)],
      this.deployer,
    ).result;
  }

  getListingInUstx(tokenId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "get-listing-in-ustx",
      [Cl.uint(tokenId)],
      this.deployer,
    ).result;
  }

  getLastTokenId(): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "get-last-token-id",
      [],
      this.deployer,
    ).result;
  }

  uintToString(): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "uint-to-string",
      [],
      this.deployer,
    ).result;
  }

  getTokenUri(tokenId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "get-token-uri",
      [Cl.uint(tokenId)],
      this.deployer,
    ).result;
  }

  getOwner(tokenId: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "get-owner",
      [Cl.uint(tokenId)],
      this.deployer,
    ).result;
  }

  setBaseUri(caller: string, root: string): ClarityValue {
    return simnet.callPublicFn(
      "ststx-withdraw-nft-v2",
      "set-base-token-uri",
      [Cl.stringAscii(root)],
      caller,
    ).result;
  }

  transfer(caller: string, tokenId: number, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststx-withdraw-nft-v2",
      "transfer",
      [Cl.uint(tokenId), Cl.principal(caller), Cl.principal(receiver)],
      caller,
    ).result;
  }

  mintForProtocol(caller: string, receiver: string): ClarityValue {
    return simnet.callPublicFn(
      "ststx-withdraw-nft-v2",
      "mint-for-protocol",
      [Cl.principal(receiver)],
      caller,
    ).result;
  }

  burnForProtocol(caller: string, tokenId: number): ClarityValue {
    return simnet.callPublicFn(
      "ststx-withdraw-nft-v2",
      "burn-for-protocol",
      [Cl.uint(tokenId)],
      caller,
    ).result;
  }

  listInUstx(caller: string, tokenId: number, price: number): ClarityValue {
    return simnet.callPublicFn(
      "ststx-withdraw-nft-v2",
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
      "ststx-withdraw-nft-v2",
      "unlist-in-ustx",
      [Cl.uint(tokenId)],
      caller,
    ).result;
  }

  buyInUstx(caller: string, tokenId: number): ClarityValue {
    return simnet.callPublicFn(
      "ststx-withdraw-nft-v2",
      "buy-in-ustx",
      [
        Cl.uint(tokenId),
        Cl.principal(qualifiedName("marketplace-commission")),
      ],
      caller,
    ).result;
  }
}
