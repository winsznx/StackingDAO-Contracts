import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// stSTXbtc tracking
// ---------------------------------------------------------

type HolderPosition = { holder: string; position: string };

export class StStxBtcTracking {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getClaimsEnabled(): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-tracking-v2",
      "get-claims-enabled",
      [],
      this.deployer,
    ).result;
  }

  getSavedRewards(holder: string, position: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-tracking-v2",
      "get-saved-rewards",
      [Cl.principal(holder), Cl.principal(position)],
      this.deployer,
    ).result;
  }

  refreshWallet(caller: string, holder: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-v2",
      "refresh-wallet",
      [Cl.principal(holder), Cl.uint(amount)],
      caller,
    ).result;
  }

  refreshPosition(caller: string, holder: string, position: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-v2",
      "refresh-position",
      [Cl.principal(holder), Cl.principal(position)],
      caller,
    ).result;
  }

  savePendingRewards(caller: string, holder: string, position: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-v2",
      "save-pending-rewards",
      [Cl.principal(holder), Cl.principal(position)],
      caller,
    ).result;
  }

  addRewards(caller: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-v2",
      "add-rewards",
      [Cl.uint(amount * 100_000_000)],
      caller,
    ).result;
  }

  getPendingRewardsMany(holders: HolderPosition[]): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-tracking-v2",
      "get-pending-rewards-many",
      [
        Cl.list(
          holders.map((h) =>
            Cl.tuple({
              holder: Cl.principal(h.holder),
              position: Cl.principal(h.position),
            }),
          ),
        ),
      ],
      this.deployer,
    ).result;
  }

  getPendingRewards(holder: string, position: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-tracking-v2",
      "get-pending-rewards",
      [Cl.principal(holder), Cl.principal(position)],
      this.deployer,
    ).result;
  }

  claimPendingRewardsMany(caller: string, holders: HolderPosition[]): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-v2",
      "claim-pending-rewards-many",
      [
        Cl.list(
          holders.map((h) =>
            Cl.tuple({
              holder: Cl.principal(h.holder),
              position: Cl.principal(h.position),
            }),
          ),
        ),
      ],
      caller,
    ).result;
  }

  claimPendingRewards(caller: string, holder: string, position: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-v2",
      "claim-pending-rewards",
      [Cl.principal(holder), Cl.principal(position)],
      caller,
    ).result;
  }

  withdrawTokens(caller: string, recipient: string, amount: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-v2",
      "withdraw-tokens",
      [Cl.principal(recipient), Cl.uint(amount * 100_000_000)],
      caller,
    ).result;
  }

  setClaimsEnabled(caller: string, active: boolean): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-v2",
      "set-claims-enabled",
      [Cl.bool(active)],
      caller,
    ).result;
  }

  setSupportedPositions(
    caller: string,
    position: string,
    active: boolean,
    reserve: string,
  ): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-v2",
      "set-supported-positions",
      [Cl.principal(position), Cl.bool(active), Cl.principal(reserve)],
      caller,
    ).result;
  }
}
