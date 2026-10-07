import {
  Cl,
  ClarityType,
  ClarityValue,
  ListCV,
  ResponseOkCV,
  SomeCV,
  TupleCV,
  UIntCV,
} from "@stacks/transactions";

// Get full qualified name based on contract name
export function qualifiedName(contractName: string) {
  return "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM." + contractName;
}

// Uint with 6-decimal scaling. Equivalent to the old String.prototype.expectUintWithDecimals.
// The product can exceed Number.MAX_SAFE_INTEGER, so we widen to bigint before passing to Cl.uint.
export function uintWithDecimals(value: number, decimals: number = 6): UIntCV {
  const scale = 10 ** decimals;
  const scaled = Math.round(value * scale);
  if (!Number.isFinite(scaled)) {
    throw new Error(`uintWithDecimals: value ${value} * 10^${decimals} overflowed`);
  }
  return Cl.uint(BigInt(scaled));
}

// Extract a field from a TupleCV so it can be asserted on with a Clarity matcher.
export function tupleField(cv: ClarityValue, key: string): ClarityValue {
  if (cv.type !== ClarityType.Tuple) {
    throw new Error(`tupleField: expected Tuple, got ${ClarityType[cv.type]}`);
  }
  const field = (cv as TupleCV).data[key];
  if (field === undefined) {
    throw new Error(`tupleField: tuple has no field "${key}"`);
  }
  return field;
}

// Unwrap a (some ...) to its inner value.
export function someValue(cv: ClarityValue): ClarityValue {
  if (cv.type !== ClarityType.OptionalSome) {
    throw new Error(`someValue: expected Some, got ${ClarityType[cv.type]}`);
  }
  return (cv as SomeCV).value;
}

// Unwrap an (ok ...) to its inner value.
export function okValue(cv: ClarityValue): ClarityValue {
  if (cv.type !== ClarityType.ResponseOk) {
    throw new Error(`okValue: expected ResponseOk, got ${ClarityType[cv.type]}`);
  }
  return (cv as ResponseOkCV).value;
}

// Extract a single element from a ListCV by index.
export function listElement(cv: ClarityValue, index: number): ClarityValue {
  if (cv.type !== ClarityType.List) {
    throw new Error(`listElement: expected List, got ${ClarityType[cv.type]}`);
  }
  const item = (cv as ListCV).list[index];
  if (item === undefined) {
    throw new Error(`listElement: index ${index} out of bounds`);
  }
  return item;
}

// Convert hex to bytes
export function hexToBytes(hex: string) {
  return hexToBytesHelper(
    hex.substring(0, 2) === "0x" ? hex.substring(2) : hex,
  );
}

export const REWARD_CYCLE_LENGTH = 21; // pox-3 is 2100
export const PREPARE_PHASE_LENGTH = 3; // pox-3 is 100

// Mine empty burn blocks so the next block to be mined lands at burn height
// `target`. In practice this matches the semantics of the old clarinet
// `chain.mineEmptyBlockUntil`: after the call, the next public call executes
// at burn height = `target`, and read-only calls observe `target - 1`.
export function mineEmptyBlockUntil(target: number): void {
  const delta = target - simnet.burnBlockHeight;
  if (delta > 0) simnet.mineEmptyBurnBlocks(delta);
}

function hexToBytesHelper(hex: string) {
  if (typeof hex !== "string")
    throw new TypeError("hexToBytes: expected string, got " + typeof hex);
  if (hex.length % 2)
    throw new Error(
      `hexToBytes: received invalid unpadded hex, got: ${hex.length}`,
    );
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < array.length; i++) {
    const j = i * 2;
    array[i] = Number.parseInt(hex.slice(j, j + 2), 16);
  }
  return array;
}
