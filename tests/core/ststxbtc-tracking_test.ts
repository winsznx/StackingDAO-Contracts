import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

import { listElement, okValue, qualifiedName, uintWithDecimals } from "../wrappers/tests-utils";
import { SBtcToken } from "../wrappers/sbtc-token-helpers";
import { StStxBtcToken } from "../wrappers/ststxbtc-token-helpers";
import { StStxBtcTracking } from "../wrappers/ststxbtc-tracking-helpers";
import { StStxBtcTrackingData } from "../wrappers/ststxbtc-tracking-data-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;

//-------------------------------------
// Tracking
//-------------------------------------

describe("ststxbtc-tracking", () => {
  it("ststxbtc-tracking: refresh-wallet will add holder once", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    // Mint
    expect(stStxBtcToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.mintForProtocol(deployer, 1000, wallet_2)).toBeOk(Cl.bool(true));

    // Position
    expect(stStxBtcTrackingData.getHolderPosition(wallet_1, wallet_1)).toBeTuple({
      amount: uintWithDecimals(2000),
      "cumm-reward": Cl.uint(0),
    });
    expect(stStxBtcTrackingData.getHolderPosition(wallet_2, wallet_2)).toBeTuple({
      amount: uintWithDecimals(1000),
      "cumm-reward": Cl.uint(0),
    });

    // List
    expect(stStxBtcTrackingData.getHoldersAddressToIndex(wallet_1)).toBeSome(Cl.uint(0));

    expect(stStxBtcTrackingData.getHoldersAddressToIndex(wallet_2)).toBeSome(Cl.uint(1));

    expect(stStxBtcTrackingData.getHoldersIndexToAddress(0)).toBeSome(Cl.principal(wallet_1));

    expect(stStxBtcTrackingData.getHoldersIndexToAddress(1)).toBeSome(Cl.principal(wallet_2));

    expect(stStxBtcTrackingData.getNextHolderIndex()).toBeUint(2);
  });

  it("ststxbtc-tracking: refresh-position will add holder once", () => {
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);

    expect(stStxBtcToken.mintForProtocol(deployer, 1000, qualifiedName("position-mock"))).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        true,
        qualifiedName("position-mock"),
      ),
    ).toBeOk(Cl.bool(true));

    // Position
    expect(stStxBtcTrackingData.getHolderPosition(wallet_1, qualifiedName("position-mock"))).toBeTuple({
      amount: uintWithDecimals(0),
      "cumm-reward": Cl.uint(0),
    });
    expect(stStxBtcTrackingData.getHolderPosition(wallet_2, qualifiedName("position-mock"))).toBeTuple({
      amount: uintWithDecimals(0),
      "cumm-reward": Cl.uint(0),
    });

    // Refresh
    expect(stStxBtcTracking.refreshPosition(wallet_1, wallet_1, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(100));
    expect(stStxBtcTracking.refreshPosition(wallet_1, wallet_2, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(100));

    // Position
    expect(stStxBtcTrackingData.getHolderPosition(wallet_1, qualifiedName("position-mock"))).toBeTuple({
      amount: uintWithDecimals(100),
      "cumm-reward": Cl.uint(0),
    });
    expect(stStxBtcTrackingData.getHolderPosition(wallet_2, qualifiedName("position-mock"))).toBeTuple({
      amount: uintWithDecimals(100),
      "cumm-reward": Cl.uint(0),
    });

    // List
    expect(stStxBtcTrackingData.getHoldersAddressToIndex(qualifiedName("position-mock"))).toBeSome(Cl.uint(0));

    expect(stStxBtcTrackingData.getHoldersAddressToIndex(wallet_1)).toBeSome(Cl.uint(1));

    expect(stStxBtcTrackingData.getHoldersAddressToIndex(wallet_2)).toBeSome(Cl.uint(2));

    expect(stStxBtcTrackingData.getHoldersIndexToAddress(0)).toBeSome(Cl.principal(qualifiedName("position-mock")));

    expect(stStxBtcTrackingData.getHoldersIndexToAddress(1)).toBeSome(Cl.principal(wallet_1));

    expect(stStxBtcTrackingData.getHoldersIndexToAddress(2)).toBeSome(Cl.principal(wallet_2));

    expect(stStxBtcTrackingData.getNextHolderIndex()).toBeUint(3);
  });

  it("ststxbtc-tracking: refresh-wallet will save rewards if any", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const sBtcToken = new SBtcToken(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));

    // Mint
    expect(stStxBtcToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.mintForProtocol(deployer, 2000, wallet_2)).toBeOk(Cl.bool(true));

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 300)).toBeOk(Cl.bool(true));

    // Rewards
    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: deployer, position: deployer },
        { holder: wallet_1, position: wallet_1 },
        { holder: wallet_2, position: wallet_2 },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(100, 8)),
      Cl.ok(uintWithDecimals(200, 8)),
    ]);

    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(0, 8));
    expect(sBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(0, 8));

    // Refresh wallet
    expect(stStxBtcToken.mintForProtocol(deployer, 2000, wallet_2)).toBeOk(Cl.bool(true));

    // Rewards
    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: deployer, position: deployer },
        { holder: wallet_1, position: wallet_1 },
        { holder: wallet_2, position: wallet_2 },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(100, 8)),
      Cl.ok(uintWithDecimals(200, 8)),
    ]);

    expect(stStxBtcTracking.getSavedRewards(deployer, deployer)).toBeUint(uintWithDecimals(0, 8).value);
    expect(stStxBtcTracking.getSavedRewards(wallet_1, wallet_1)).toBeUint(uintWithDecimals(0, 8).value);
    expect(stStxBtcTracking.getSavedRewards(wallet_2, wallet_2)).toBeUint(uintWithDecimals(200, 8).value);

    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(0, 8));
    expect(sBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(0, 8));

    // Claim
    expect(stStxBtcTracking.claimPendingRewards(deployer, deployer, deployer)).toBeOk(uintWithDecimals(0, 8));
    expect(stStxBtcTracking.claimPendingRewards(wallet_1, wallet_1, wallet_1)).toBeOk(uintWithDecimals(100, 8));
    expect(stStxBtcTracking.claimPendingRewards(wallet_2, wallet_2, wallet_2)).toBeOk(uintWithDecimals(200, 8));

    expect(stStxBtcTracking.getSavedRewards(deployer, deployer)).toBeUint(uintWithDecimals(0, 8).value);
    expect(stStxBtcTracking.getSavedRewards(wallet_1, wallet_1)).toBeUint(uintWithDecimals(0, 8).value);

    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(100, 8));
    expect(sBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(200, 8));
  });

  it("ststxbtc-tracking: refresh-position will save rewards if any", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const sBtcToken = new SBtcToken(deployer);

    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        true,
        qualifiedName("position-mock"),
      ),
    ).toBeOk(Cl.bool(true));

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));

    // Mint
    expect(stStxBtcToken.mintForProtocol(deployer, 100, qualifiedName("position-mock"))).toBeOk(Cl.bool(true));

    // Rewards
    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: wallet_1, position: qualifiedName("position-mock") },
        { holder: wallet_2, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
    ]);

    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(0, 8));
    expect(sBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(0, 8));

    // Refresh
    expect(stStxBtcTracking.refreshPosition(wallet_2, wallet_1, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(100));

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 300)).toBeOk(Cl.bool(true));

    // Rewards
    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
        { holder: wallet_2, position: wallet_2 },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(300, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
    ]);

    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(0, 8));
    expect(sBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(0, 8));

    // Refresh
    expect(stStxBtcTracking.refreshPosition(wallet_2, wallet_1, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(100));

    // Rewards
    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: wallet_1, position: qualifiedName("position-mock") },
        { holder: wallet_2, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(300, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
    ]);

    expect(stStxBtcTracking.getSavedRewards(deployer, qualifiedName("position-mock"))).toBeUint(uintWithDecimals(0, 8).value);
    expect(stStxBtcTracking.getSavedRewards(wallet_1, qualifiedName("position-mock"))).toBeUint(uintWithDecimals(300, 8).value);
    expect(stStxBtcTracking.getSavedRewards(wallet_2, qualifiedName("position-mock"))).toBeUint(uintWithDecimals(0, 8).value);

    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(0, 8));
    expect(sBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(0, 8));

    // Claim
    expect(stStxBtcTracking.claimPendingRewards(deployer, deployer, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(0, 8));
    expect(stStxBtcTracking.claimPendingRewards(wallet_1, wallet_1, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(300, 8));
    expect(stStxBtcTracking.claimPendingRewards(wallet_2, wallet_2, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(0, 8));

    expect(stStxBtcTracking.getSavedRewards(deployer, qualifiedName("position-mock"))).toBeUint(uintWithDecimals(0, 8).value);
    expect(stStxBtcTracking.getSavedRewards(wallet_1, qualifiedName("position-mock"))).toBeUint(uintWithDecimals(0, 8).value);

    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals(300, 8));
    expect(sBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals(0, 8));
  });

  //-------------------------------------
  // Rewards
  //-------------------------------------

  it("ststxbtc-tracking: can add and claim rewards", () => {
    const sBtcToken = new SBtcToken(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.mintForProtocol(deployer, 70000, deployer)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 20000, wallet_1)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 10000, wallet_2)).toBeOk(Cl.bool(true));

    expect(stStxBtcTrackingData.getTotalSupply()).toBeUint(100000 * 1_000_000);

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 1000)).toBeOk(Cl.bool(true));

    expect(stStxBtcTracking.getPendingRewards(deployer, deployer)).toBeOk(uintWithDecimals((70000 / 100000) * 1000, 8));

    expect(stStxBtcTracking.getPendingRewards(wallet_1, wallet_1)).toBeOk(uintWithDecimals((20000 / 100000) * 1000, 8));

    expect(stStxBtcTracking.getPendingRewards(wallet_2, wallet_2)).toBeOk(uintWithDecimals((10000 / 100000) * 1000, 8));

    // Claim rewards
    expect(stStxBtcTracking.claimPendingRewards(deployer, deployer, deployer)).toBeOk(uintWithDecimals((70000 / 100000) * 1000, 8));

    expect(stStxBtcTracking.claimPendingRewards(deployer, wallet_1, wallet_1)).toBeOk(uintWithDecimals((20000 / 100000) * 1000, 8));

    expect(stStxBtcTracking.claimPendingRewards(deployer, wallet_2, wallet_2)).toBeOk(uintWithDecimals((10000 / 100000) * 1000, 8));

    expect(sBtcToken.getBalance(wallet_1)).toBeOk(uintWithDecimals((20000 / 100000) * 1000, 8));

    expect(sBtcToken.getBalance(wallet_2)).toBeOk(uintWithDecimals((10000 / 100000) * 1000, 8));

    expect(stStxBtcTracking.getPendingRewards(deployer, deployer)).toBeOk(uintWithDecimals(0, 8));
  });

  it("ststxbtc-tracking: can get and claim multiple rewards", () => {
    const sBtcToken = new SBtcToken(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.mintForProtocol(deployer, 70000, deployer)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 20000, wallet_1)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 5000, wallet_2)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 5000, wallet_3)).toBeOk(Cl.bool(true));

    expect(stStxBtcTrackingData.getTotalSupply()).toBeUint(100000 * 1_000_000);

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 1000)).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: deployer, position: deployer },
        { holder: wallet_1, position: wallet_1 },
        { holder: wallet_2, position: wallet_2 },
        { holder: wallet_3, position: wallet_3 },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals((70000 / 100000) * 1000, 8)),
      Cl.ok(uintWithDecimals((20000 / 100000) * 1000, 8)),
      Cl.ok(uintWithDecimals((5000 / 100000) * 1000, 8)),
      Cl.ok(uintWithDecimals((5000 / 100000) * 1000, 8)),
    ]);

    expect(
      stStxBtcTracking.claimPendingRewardsMany(wallet_1, [
        { holder: deployer, position: deployer },
        { holder: wallet_1, position: wallet_1 },
        { holder: wallet_2, position: wallet_2 },
      ]),
    ).toBeOk(
      Cl.list([
        Cl.ok(uintWithDecimals((70000 / 100000) * 1000, 8)),
        Cl.ok(uintWithDecimals((20000 / 100000) * 1000, 8)),
        Cl.ok(uintWithDecimals((5000 / 100000) * 1000, 8)),
      ]),
    );

    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: deployer, position: deployer },
        { holder: wallet_1, position: wallet_1 },
        { holder: wallet_2, position: wallet_2 },
        { holder: wallet_3, position: wallet_3 },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals((5000 / 100000) * 1000, 8)),
    ]);

    expect(
      stStxBtcTracking.claimPendingRewardsMany(wallet_1, [
        { holder: deployer, position: deployer },
        { holder: wallet_1, position: wallet_1 },
        { holder: wallet_2, position: wallet_2 },
        { holder: wallet_3, position: wallet_3 },
      ]),
    ).toBeOk(
      Cl.list([
        Cl.ok(uintWithDecimals(0, 8)),
        Cl.ok(uintWithDecimals(0, 8)),
        Cl.ok(uintWithDecimals(0, 8)),
        Cl.ok(uintWithDecimals((5000 / 100000) * 1000, 8)),
      ]),
    );

    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: deployer, position: deployer },
        { holder: wallet_1, position: wallet_1 },
        { holder: wallet_2, position: wallet_2 },
        { holder: wallet_3, position: wallet_3 },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
    ]);
  });

  it("ststxbtc-tracking: get and claim many rewards", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const sBtcToken = new SBtcToken(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));

    // Mint
    expect(stStxBtcToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.mintForProtocol(deployer, 2000, wallet_2)).toBeOk(Cl.bool(true));

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 300)).toBeOk(Cl.bool(true));

    // Rewards
    const infoArray = [
      { holder: deployer, position: deployer },
      { holder: wallet_1, position: wallet_1 },
      { holder: wallet_2, position: wallet_2 },
    ];
    for (let i = 0; i < 195; i++) {
      infoArray.push({ holder: deployer, position: deployer });
    }

    const rewards = stStxBtcTracking.getPendingRewardsMany(infoArray);
    expect(listElement(rewards, 0)).toBeOk(uintWithDecimals(0, 8));
    expect(listElement(rewards, 1)).toBeOk(uintWithDecimals(100, 8));
    expect(listElement(rewards, 2)).toBeOk(uintWithDecimals(200, 8));
    expect(listElement(rewards, 3)).toBeOk(uintWithDecimals(0, 8));
    expect(listElement(rewards, 4)).toBeOk(uintWithDecimals(0, 8));

    const claimed = okValue(stStxBtcTracking.claimPendingRewardsMany(wallet_1, infoArray));
    expect(listElement(claimed, 0)).toBeOk(uintWithDecimals(0, 8));
    expect(listElement(claimed, 1)).toBeOk(uintWithDecimals(100, 8));
    expect(listElement(claimed, 2)).toBeOk(uintWithDecimals(200, 8));
    expect(listElement(claimed, 3)).toBeOk(uintWithDecimals(0, 8));
    expect(listElement(claimed, 4)).toBeOk(uintWithDecimals(0, 8));
  });

  it("ststxbtc-tracking: can not claim multiple times", () => {
    const sBtcToken = new SBtcToken(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.mintForProtocol(deployer, 70000, deployer)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 20000, wallet_1)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 10000, wallet_2)).toBeOk(Cl.bool(true));

    expect(stStxBtcTrackingData.getTotalSupply()).toBeUint(100000 * 1_000_000);

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 1000)).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: deployer, position: deployer },
        { holder: wallet_1, position: wallet_1 },
        { holder: wallet_2, position: wallet_2 },
        { holder: wallet_1, position: wallet_1 },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals((70000 / 100000) * 1000, 8)),
      Cl.ok(uintWithDecimals((20000 / 100000) * 1000, 8)),
      Cl.ok(uintWithDecimals((10000 / 100000) * 1000, 8)),
      Cl.ok(uintWithDecimals((20000 / 100000) * 1000, 8)),
    ]);

    expect(
      stStxBtcTracking.claimPendingRewardsMany(wallet_1, [
        { holder: deployer, position: deployer },
        { holder: wallet_1, position: wallet_1 },
        { holder: wallet_2, position: wallet_2 },
        { holder: wallet_1, position: wallet_1 },
      ]),
    ).toBeOk(
      Cl.list([
        Cl.ok(uintWithDecimals((70000 / 100000) * 1000, 8)),
        Cl.ok(uintWithDecimals((20000 / 100000) * 1000, 8)),
        Cl.ok(uintWithDecimals((10000 / 100000) * 1000, 8)),
        Cl.ok(uintWithDecimals(0, 8)),
      ]),
    );
  });

  it("ststxbtc-tracking: add rewards multiple times", () => {
    const sBtcToken = new SBtcToken(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.mintForProtocol(deployer, 7000, deployer)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 2000, wallet_1)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 1000, qualifiedName("position-mock"))).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        true,
        qualifiedName("position-mock"),
      ),
    ).toBeOk(Cl.bool(true));

    // Refresh positions
    expect(stStxBtcTracking.refreshPosition(deployer, deployer, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(100));
    expect(stStxBtcTracking.refreshPosition(deployer, wallet_1, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(100));

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 1000)).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: deployer, position: deployer },
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: deployer, position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(700, 8)),
      Cl.ok(uintWithDecimals(200, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(10, 8)),
      Cl.ok(uintWithDecimals(10, 8)),
    ]);

    // Claim some rewards
    expect(
      stStxBtcTracking.claimPendingRewardsMany(wallet_1, [
        { holder: wallet_1, position: wallet_1 },
        { holder: deployer, position: qualifiedName("position-mock") },
      ]),
    ).toBeOk(
      Cl.list([
        Cl.ok(uintWithDecimals(200, 8)),
        Cl.ok(uintWithDecimals(10, 8)),
      ]),
    );

    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: deployer, position: deployer },
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: deployer, position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(700, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(10, 8)),
    ]);

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 2000)).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: deployer, position: deployer },
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: deployer, position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(700 + 1400, 8)),
      Cl.ok(uintWithDecimals(0 + 400, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(0 + 20, 8)),
      Cl.ok(uintWithDecimals(10 + 20, 8)),
    ]);
  });

  it("ststxbtc-tracking: enable and disable supported position and check rewards", () => {
    const sBtcToken = new SBtcToken(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 2000, qualifiedName("position-mock"))).toBeOk(Cl.bool(true));

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 1500)).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(500, 8)),
      Cl.ok(uintWithDecimals(1000, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
    ]);

    // Enable position
    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        true,
        qualifiedName("position-mock"),
      ),
    ).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(500, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
    ]);

    // Update position
    expect(stStxBtcTracking.refreshPosition(deployer, wallet_1, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(100));

    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(500, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
    ]);

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 1500)).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(500 + 500, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(50, 8)),
    ]);

    // Disable position
    // Must claim rewards from users position
    expect(stStxBtcTracking.claimPendingRewards(deployer, wallet_1, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(50, 8));
    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        false,
        qualifiedName("position-mock"),
      ),
    ).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(500 + 500, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
    ]);
  });

  //-------------------------------------
  // Claims enabled
  //-------------------------------------

  it("ststxbtc-tracking: can enable and disable reward claims", () => {
    const stStxBtcTracking = new StStxBtcTracking(deployer);

    expect(stStxBtcTracking.claimPendingRewards(deployer, deployer, deployer)).toBeOk(uintWithDecimals(0));

    expect(stStxBtcTracking.setClaimsEnabled(deployer, false)).toBeOk(Cl.bool(true));

    expect(stStxBtcTracking.claimPendingRewards(deployer, deployer, deployer)).toBeErr(Cl.uint(10002002));

    expect(stStxBtcTracking.setClaimsEnabled(deployer, true)).toBeOk(Cl.bool(true));

    expect(stStxBtcTracking.claimPendingRewards(deployer, deployer, deployer)).toBeOk(uintWithDecimals(0));
  });

  //-------------------------------------
  // Admin
  //-------------------------------------

  it("ststxbtc-tracking: can withdraw tokens", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const sBtcToken = new SBtcToken(deployer);

    expect(sBtcToken.protocolMint(deployer, 300, deployer)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.mintForProtocol(deployer, 3000, deployer)).toBeOk(Cl.bool(true));

    expect(sBtcToken.getBalance(deployer)).toBeOk(uintWithDecimals(300, 8));

    expect(sBtcToken.getBalance(qualifiedName("ststxbtc-tracking-v2"))).toBeOk(uintWithDecimals(0));

    expect(stStxBtcTracking.addRewards(deployer, 300)).toBeOk(Cl.bool(true));

    expect(sBtcToken.getBalance(deployer)).toBeOk(uintWithDecimals(0));

    expect(sBtcToken.getBalance(qualifiedName("ststxbtc-tracking-v2"))).toBeOk(uintWithDecimals(300, 8));

    expect(stStxBtcTracking.withdrawTokens(deployer, deployer, 300)).toBeOk(Cl.bool(true));

    expect(sBtcToken.getBalance(deployer)).toBeOk(uintWithDecimals(300, 8));

    expect(sBtcToken.getBalance(qualifiedName("ststxbtc-tracking-v2"))).toBeOk(uintWithDecimals(0));
  });

  //-------------------------------------
  // Access and Errors
  //-------------------------------------

  it("ststxbtc-tracking: unsupported position in refresh-position", () => {
    const stStxBtcTracking = new StStxBtcTracking(deployer);

    expect(stStxBtcTracking.refreshPosition(deployer, deployer, qualifiedName("position-mock"))).toBeErr(Cl.uint(10002001));
  });

  it("ststxbtc-tracking: set-total-supply and add-wallet can only be used by protocol", () => {
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const stStxBtcTrackingData = new StStxBtcTrackingData(deployer);

    expect(stStxBtcTrackingData.setTotalSupply(wallet_1, 100)).toBeErr(Cl.uint(20003));

    expect(stStxBtcTracking.refreshWallet(wallet_1, wallet_1, 100)).toBeErr(Cl.uint(20003));
  });

  it("ststxbtc-tracking: admin functions can only be used by protocol", () => {
    const stStxBtcTracking = new StStxBtcTracking(deployer);

    expect(
      stStxBtcTracking.setSupportedPositions(wallet_1, qualifiedName("position-mock"), true, wallet_1),
    ).toBeErr(Cl.uint(20003));

    expect(stStxBtcTracking.withdrawTokens(wallet_1, wallet_1, 10)).toBeErr(Cl.uint(20003));

    expect(stStxBtcTracking.setClaimsEnabled(wallet_1, false)).toBeErr(Cl.uint(20003));
  });

  it("ststxbtc-tracking: can not update position if total above reserve", () => {
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);

    expect(stStxBtcToken.mintForProtocol(deployer, 200, qualifiedName("position-mock"))).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        true,
        qualifiedName("position-mock"),
      ),
    ).toBeOk(Cl.bool(true));

    // Refresh positions
    expect(stStxBtcTracking.refreshPosition(deployer, deployer, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(100));
    expect(stStxBtcTracking.refreshPosition(deployer, wallet_1, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(100));
    expect(stStxBtcTracking.refreshPosition(deployer, wallet_2, qualifiedName("position-mock"))).toBeErr(Cl.uint(10002003));
  });

  it("ststxbtc-tracking: can not set supported position to same active state", () => {
    const stStxBtcTracking = new StStxBtcTracking(deployer);

    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        false,
        qualifiedName("position-mock"),
      ),
    ).toBeErr(Cl.uint(10002004));

    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        true,
        qualifiedName("position-mock"),
      ),
    ).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        true,
        qualifiedName("position-mock"),
      ),
    ).toBeErr(Cl.uint(10002004));

    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        false,
        qualifiedName("position-mock"),
      ),
    ).toBeOk(Cl.bool(true));
  });

  it("ststxbtc-tracking: supported position can only be activated once", () => {
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const stStxBtcToken = new StStxBtcToken(deployer);

    expect(stStxBtcToken.mintForProtocol(deployer, 1000, qualifiedName("position-mock"))).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        true,
        qualifiedName("position-mock"),
      ),
    ).toBeOk(Cl.bool(true));

    expect(stStxBtcTracking.refreshPosition(deployer, deployer, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(100));

    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        false,
        qualifiedName("position-mock"),
      ),
    ).toBeOk(Cl.bool(true));

    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        true,
        qualifiedName("position-mock"),
      ),
    ).toBeErr(Cl.uint(10002005));
  });

  //-------------------------------------
  // Audit - Position whitelist
  //-------------------------------------

  it("ststxbtc-tracking: rewards if position added / removed from whitelist", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const sBtcToken = new SBtcToken(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));

    // Mint
    expect(stStxBtcToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));
    expect(stStxBtcToken.mintForProtocol(deployer, 2000, qualifiedName("position-mock"))).toBeOk(Cl.bool(true));

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 300)).toBeOk(Cl.bool(true));

    // Rewards
    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(100, 8)),
      Cl.ok(uintWithDecimals(200, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
    ]);

    //
    // Add to whitelist
    //
    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        true,
        qualifiedName("position-mock"),
      ),
    ).toBeOk(Cl.bool(true));

    // Update position
    expect(stStxBtcTracking.refreshPosition(deployer, wallet_1, qualifiedName("position-mock"))).toBeOk(uintWithDecimals(100));

    // Rewards
    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(100, 8)),
      Cl.ok(uintWithDecimals(0, 8)), // Auto claimed rewards
      Cl.ok(uintWithDecimals(0, 8)),
    ]);

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 300)).toBeOk(Cl.bool(true));

    // Rewards
    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(200, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(10, 8)),
    ]);

    //
    // Remove whitelist
    //
    expect(
      stStxBtcTracking.setSupportedPositions(
        deployer,
        qualifiedName("position-mock"),
        false,
        qualifiedName("position-mock"),
      ),
    ).toBeOk(Cl.bool(true));

    // Rewards
    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(200, 8)),
      Cl.ok(uintWithDecimals(0, 8)),
      Cl.ok(uintWithDecimals(10, 8)),
    ]);

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 300)).toBeOk(Cl.bool(true));

    // Rewards
    expect(
      stStxBtcTracking.getPendingRewardsMany([
        { holder: wallet_1, position: wallet_1 },
        { holder: qualifiedName("position-mock"), position: qualifiedName("position-mock") },
        { holder: wallet_1, position: qualifiedName("position-mock") },
      ]),
    ).toBeList([
      Cl.ok(uintWithDecimals(300, 8)),
      Cl.ok(uintWithDecimals(200, 8)),
      Cl.ok(uintWithDecimals(10, 8)),
    ]);
  });

  //-------------------------------------
  // Audit - Double rewards
  //-------------------------------------

  it("ststxbtc-tracking: correctly save rewards", () => {
    const stStxBtcToken = new StStxBtcToken(deployer);
    const stStxBtcTracking = new StStxBtcTracking(deployer);
    const sBtcToken = new SBtcToken(deployer);

    expect(sBtcToken.protocolMint(deployer, 100000, deployer)).toBeOk(Cl.bool(true));

    // Mint
    expect(stStxBtcToken.mintForProtocol(deployer, 1000, wallet_1)).toBeOk(Cl.bool(true));

    expect(stStxBtcToken.mintForProtocol(deployer, 2000, wallet_2)).toBeOk(Cl.bool(true));

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 300)).toBeOk(Cl.bool(true));

    expect(stStxBtcTracking.getPendingRewards(wallet_1, wallet_1)).toBeOk(uintWithDecimals(100, 8));

    expect(stStxBtcTracking.savePendingRewards(deployer, wallet_1, wallet_1)).toBeOk(uintWithDecimals(100, 8));

    expect(stStxBtcTracking.getPendingRewards(wallet_1, wallet_1)).toBeOk(uintWithDecimals(100, 8));

    expect(stStxBtcTracking.getSavedRewards(wallet_1, wallet_1)).toBeUint(uintWithDecimals(100, 8).value);

    expect(stStxBtcTracking.savePendingRewards(deployer, wallet_1, wallet_1)).toBeOk(uintWithDecimals(0, 8));

    expect(stStxBtcTracking.getPendingRewards(wallet_1, wallet_1)).toBeOk(uintWithDecimals(100, 8));

    expect(stStxBtcTracking.getSavedRewards(wallet_1, wallet_1)).toBeUint(uintWithDecimals(100, 8).value);

    // Add rewards
    expect(stStxBtcTracking.addRewards(deployer, 600)).toBeOk(Cl.bool(true));

    expect(stStxBtcTracking.getPendingRewards(wallet_1, wallet_1)).toBeOk(uintWithDecimals(300, 8));

    expect(stStxBtcTracking.savePendingRewards(deployer, wallet_1, wallet_1)).toBeOk(uintWithDecimals(300, 8));

    expect(stStxBtcTracking.getPendingRewards(wallet_1, wallet_1)).toBeOk(uintWithDecimals(300, 8));

    expect(stStxBtcTracking.getSavedRewards(wallet_1, wallet_1)).toBeUint(uintWithDecimals(300, 8).value);

    expect(stStxBtcTracking.savePendingRewards(deployer, wallet_1, wallet_1)).toBeOk(uintWithDecimals(0, 8));

    expect(stStxBtcTracking.getPendingRewards(wallet_1, wallet_1)).toBeOk(uintWithDecimals(300, 8));

    expect(stStxBtcTracking.getSavedRewards(wallet_1, wallet_1)).toBeUint(uintWithDecimals(300, 8).value);
  });
});
