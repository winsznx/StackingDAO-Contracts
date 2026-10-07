import { describe, expect, it } from "vitest";
import { tx } from "@hirosystems/clarinet-sdk";
import { Cl, ClarityType } from "@stacks/transactions";

import { qualifiedName, uintWithDecimals } from "../wrappers/tests-utils";
import { CoreV1 as Core } from "../wrappers/stacking-dao-core-helpers";
import { GenesisMinter, GenesisNFT } from "../wrappers/genesis-minter-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;

describe("genesis-nft", () => {
  it("genesis-nft: airdrop OG / Diamond / Gold", () => {
    const genesisMinter = new GenesisMinter(deployer);
    const genesisNft = new GenesisNFT(deployer);
    const core = new Core(deployer);

    // Mint some stSTX
    expect(core.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    // Set cycle block to check at block 10
    expect(genesisMinter.setCycleEndBlock(10)).toHaveClarityType(ClarityType.ResponseOk);

    expect(genesisMinter.getCycleEndBlock()).toBeUint(10);

    simnet.mineEmptyBlocks(10);

    expect(genesisMinter.canClaim(wallet_1)).toBeBool(true);

    // We are past block 10 now, airdrop NFT
    expect(genesisMinter.airdrop(wallet_1, 1)).toBeOk(Cl.bool(true));

    // Cannot airdrop to the same address again
    expect(genesisMinter.airdrop(wallet_1, 1)).toBeErr(Cl.uint(1103));

    // Check if we own the NFT
    expect(genesisNft.getOwner(0)).toBeOk(Cl.some(Cl.principal(wallet_1)));

    expect(genesisNft.getGenesisType(0)).toBeUint(1);
  });

  it("genesis-nft: airdrop-many", () => {
    const genesisMinter = new GenesisMinter(deployer);
    const genesisNft = new GenesisNFT(deployer);
    const core = new Core(deployer);

    // Mint some stSTX — bundle into one block so all deposits land before cycle-end-block
    const depositArgs = [
      Cl.principal(qualifiedName("reserve-v1")),
      Cl.uint(1000 * 1_000_000),
      Cl.none(),
    ];
    const [d1, d2, d3] = simnet.mineBlock([
      tx.callPublicFn("stacking-dao-core-v1", "deposit", depositArgs, wallet_1),
      tx.callPublicFn("stacking-dao-core-v1", "deposit", depositArgs, wallet_2),
      tx.callPublicFn("stacking-dao-core-v1", "deposit", depositArgs, wallet_3),
    ]);
    expect(d1.result).toBeOk(uintWithDecimals(1000));
    expect(d2.result).toBeOk(uintWithDecimals(1000));
    expect(d3.result).toBeOk(uintWithDecimals(1000));

    // Set cycle block to check at block 10
    expect(genesisMinter.setCycleEndBlock(10)).toHaveClarityType(ClarityType.ResponseOk);

    expect(genesisMinter.getCycleEndBlock()).toBeUint(10);

    simnet.mineEmptyBlocks(10);

    expect(genesisMinter.canClaim(wallet_1)).toBeBool(true);
    expect(genesisMinter.canClaim(wallet_2)).toBeBool(true);
    expect(genesisMinter.canClaim(wallet_3)).toBeBool(true);

    // We are past block 10 now, airdrop NFT
    expect(
      genesisMinter.airdropMany([
        { recipient: wallet_1, type: 1 },
        { recipient: wallet_2, type: 1 },
        { recipient: wallet_3, type: 1 },
      ]),
    ).toBeOk(
      Cl.list([
        Cl.ok(Cl.bool(true)),
        Cl.ok(Cl.bool(true)),
        Cl.ok(Cl.bool(true)),
      ]),
    );

    expect(
      genesisMinter.airdropMany([
        { recipient: wallet_1, type: 1 },
        { recipient: wallet_2, type: 1 },
        { recipient: wallet_3, type: 1 },
      ]),
    ).toBeOk(
      Cl.list([
        Cl.error(Cl.uint(1103)),
        Cl.error(Cl.uint(1103)),
        Cl.error(Cl.uint(1103)),
      ]),
    );

    // Cannot airdrop to the same address again
    expect(genesisMinter.airdrop(wallet_1, 1)).toBeErr(Cl.uint(1103));

    // Check if we own the NFT
    expect(genesisNft.getOwner(0)).toBeOk(Cl.some(Cl.principal(wallet_1)));

    expect(genesisNft.getGenesisType(0)).toBeUint(1);

    expect(genesisNft.getOwner(1)).toBeOk(Cl.some(Cl.principal(wallet_2)));

    expect(genesisNft.getOwner(2)).toBeOk(Cl.some(Cl.principal(wallet_3)));
  });

  it("genesis-nft: mint as a user", () => {
    const genesisMinter = new GenesisMinter(deployer);
    const core = new Core(deployer);

    // Mint some stSTX
    expect(core.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    // Set cycle block to check at block 10
    expect(genesisMinter.setCycleEndBlock(10)).toHaveClarityType(ClarityType.ResponseOk);

    simnet.mineEmptyBlocks(10);

    expect(genesisMinter.claim(deployer)).toBeErr(Cl.uint(1102)); // fails

    expect(genesisMinter.claim(wallet_1)).toBeOk(Cl.bool(true)); // succeeds
  });

  it("genesis-nft: transfer NFTs", () => {
    const genesisMinter = new GenesisMinter(deployer);
    const genesisNft = new GenesisNFT(deployer);
    const core = new Core(deployer);

    // Mint some stSTX
    core.deposit(wallet_1, 1000);
    expect(core.deposit(wallet_2, 1000)).toBeOk(uintWithDecimals(1000));

    // Set cycle block to check at block 10
    expect(genesisMinter.setCycleEndBlock(10)).toHaveClarityType(ClarityType.ResponseOk);

    simnet.mineEmptyBlocks(10);

    expect(genesisMinter.claim(wallet_1)).toBeOk(Cl.bool(true)); // succeeds
    expect(genesisMinter.claim(wallet_2)).toBeOk(Cl.bool(true));

    expect(genesisNft.transfer(0, wallet_1, wallet_2)).toBeOk(Cl.bool(true));
    expect(genesisNft.getOwner(0)).toBeOk(Cl.some(Cl.principal(wallet_2)));

    expect(genesisNft.transfer(0, wallet_1, wallet_2)).toBeErr(Cl.uint(1));

    expect(genesisNft.transfer(1, wallet_2, wallet_1)).toBeOk(Cl.bool(true));
  });

  it("genesis-nft: get NFT URI", () => {
    const genesisMinter = new GenesisMinter(deployer);
    const genesisNft = new GenesisNFT(deployer);
    const core = new Core(deployer);

    // Mint some stSTX
    expect(core.deposit(wallet_1, 1000)).toBeOk(uintWithDecimals(1000));

    // Set cycle block to check at block 10
    expect(genesisMinter.setCycleEndBlock(10)).toHaveClarityType(ClarityType.ResponseOk);

    simnet.mineEmptyBlocks(10);

    expect(genesisMinter.claim(wallet_1)).toBeOk(Cl.bool(true)); // succeeds

    expect(genesisNft.setBaseTokenUri("ar://some-url")).toBeOk(Cl.bool(true));
    expect(genesisNft.getTokenUri(0)).toBeOk(Cl.some(Cl.stringAscii("ar://some-url.json")));
  });
});
