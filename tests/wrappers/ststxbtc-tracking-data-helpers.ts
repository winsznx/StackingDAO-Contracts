import { Cl, ClarityValue } from "@stacks/transactions";

// ---------------------------------------------------------
// stSTXbtc tracking data
// ---------------------------------------------------------

export class StStxBtcTrackingData {
  private deployer: string;

  constructor(deployer: string) {
    this.deployer = deployer;
  }

  getTotalSupply(): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-tracking-data-v2",
      "get-total-supply",
      [],
      this.deployer,
    ).result;
  }

  getNextHolderIndex(): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-tracking-data-v2",
      "get-next-holder-index",
      [],
      this.deployer,
    ).result;
  }

  getCummRewards(): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-tracking-data-v2",
      "get-cumm-reward",
      [],
      this.deployer,
    ).result;
  }

  getSupportedPositions(position: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-tracking-data-v2",
      "get-supported-positions",
      [Cl.principal(position)],
      this.deployer,
    ).result;
  }

  getHoldersIndexToAddress(index: number): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-tracking-data-v2",
      "get-holders-index-to-address",
      [Cl.uint(index)],
      this.deployer,
    ).result;
  }

  getHoldersAddressToIndex(holder: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-tracking-data-v2",
      "get-holders-address-to-index",
      [Cl.principal(holder)],
      this.deployer,
    ).result;
  }

  getHolderPosition(holder: string, position: string): ClarityValue {
    return simnet.callReadOnlyFn(
      "ststxbtc-tracking-data-v2",
      "get-holder-position",
      [Cl.principal(holder), Cl.principal(position)],
      this.deployer,
    ).result;
  }

  setTotalSupply(caller: string, supply: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-data-v2",
      "set-total-supply",
      [Cl.uint(supply * 1_000_000)],
      caller,
    ).result;
  }

  setNextHolderIndex(caller: string, index: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-data-v2",
      "set-next-holder-index",
      [Cl.uint(index)],
      caller,
    ).result;
  }

  setCummReward(caller: string, index: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-data-v2",
      "set-cumm-reward",
      [Cl.uint(index)],
      caller,
    ).result;
  }

  setSupportedPositions(
    caller: string,
    position: string,
    active: boolean,
    reserve: string,
    total: number,
    deactivatedCummReward: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-data-v2",
      "set-supported-positions",
      [
        Cl.principal(position),
        Cl.bool(active),
        Cl.principal(reserve),
        Cl.uint(total * 1_000_000),
        Cl.uint(deactivatedCummReward),
      ],
      caller,
    ).result;
  }

  setHoldersIndexToAddress(caller: string, index: number, holder: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-data-v2",
      "set-holders-index-to-address",
      [Cl.uint(index), Cl.principal(holder)],
      caller,
    ).result;
  }

  setHoldersAddressToIndex(caller: string, holder: string, index: number): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-data-v2",
      "set-holders-address-to-index",
      [Cl.principal(holder), Cl.uint(index)],
      caller,
    ).result;
  }

  setHolderPosition(
    caller: string,
    holder: string,
    position: string,
    amount: number,
    cumm: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-data-v2",
      "set-holder-position",
      [
        Cl.principal(holder),
        Cl.principal(position),
        Cl.uint(amount * 1_000_000),
        Cl.uint(cumm),
      ],
      caller,
    ).result;
  }

  addHolder(caller: string, holder: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-data-v2",
      "add-holder",
      [Cl.principal(holder)],
      caller,
    ).result;
  }

  updateHolderPosition(caller: string, holder: string, position: string): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-data-v2",
      "update-holder-position",
      [Cl.principal(holder), Cl.principal(position)],
      caller,
    ).result;
  }

  updateHolderPositionAmount(
    caller: string,
    holder: string,
    position: string,
    amount: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-data-v2",
      "update-holder-position-amount",
      [
        Cl.principal(holder),
        Cl.principal(position),
        Cl.uint(amount * 1_000_000),
      ],
      caller,
    ).result;
  }

  updateSupportedPositionsTotal(
    caller: string,
    position: string,
    total: number,
  ): ClarityValue {
    return simnet.callPublicFn(
      "ststxbtc-tracking-data-v2",
      "update-supported-positions-total",
      [Cl.principal(position), Cl.uint(total * 1_000_000)],
      caller,
    ).result;
  }
}
