import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// Stacking DAO Genesis Minter
// ---------------------------------------------------------

export class GenesisMinter {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getCycleEndBlock(): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-genesis-nft-minter",
      "get-cycle-end-block",
      [],
      this.deployer,
    ).result;
  }

  canClaim(recipient: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-genesis-nft-minter",
      "can-claim",
      [Cl.principal(recipient)],
      this.deployer,
    ).result;
  }

  setCycleEndBlock(blockHeight: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-genesis-nft-minter",
      "set-cycle-end-block",
      [Cl.uint(blockHeight)],
      this.deployer,
    ).result;
  }

  airdrop(recipient: string, type: number): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-genesis-nft-minter",
      "airdrop",
      [Cl.tuple({ recipient: Cl.principal(recipient), type: Cl.uint(type) })],
      this.deployer,
    ).result;
  }

  airdropMany(info: { recipient: string; type: number }[]): ClarityValue {
    const recipients = info.map((data) =>
      Cl.tuple({ recipient: Cl.principal(data.recipient), type: Cl.uint(data.type) }),
    );
    return simnet.callPublicFn(
      "stacking-dao-genesis-nft-minter",
      "airdrop-many",
      [Cl.list(recipients)],
      this.deployer,
    ).result;
  }

  claim(sender: string): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-genesis-nft-minter",
      "claim",
      [],
      sender,
    ).result;
  }
}

export class GenesisNFT {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getOwner(id: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-genesis-nft",
      "get-owner",
      [Cl.uint(id)],
      this.deployer,
    ).result;
  }

  getGenesisType(id: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-genesis-nft",
      "get-genesis-type",
      [Cl.uint(id)],
      this.deployer,
    ).result;
  }

  getTokenUri(id: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "stacking-dao-genesis-nft",
      "get-token-uri",
      [Cl.uint(id)],
      this.deployer,
    ).result;
  }

  transfer(id: number, sender: string, recipient: string): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-genesis-nft",
      "transfer",
      [Cl.uint(id), Cl.principal(sender), Cl.principal(recipient)],
      sender,
    ).result;
  }

  setBaseTokenUri(newUri: string): ClarityValue {
    return simnet.callPublicFn(
      "stacking-dao-genesis-nft",
      "set-base-token-uri",
      [Cl.stringAscii(newUri)],
      this.deployer,
    ).result;
  }
}
