export interface SeededRandom {
  next(): number;
  nextInt(minInclusive: number, maxInclusive: number): number;
}

export function createSeededRandom(seed: string | number): SeededRandom {
  let state = fnv1a(String(seed));

  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    nextInt(minInclusive, maxInclusive) {
      if (
        !Number.isInteger(minInclusive) ||
        !Number.isInteger(maxInclusive) ||
        minInclusive > maxInclusive
      ) {
        throw new Error("SeededRandom requires an ordered integer range.");
      }
      return (
        minInclusive +
        Math.floor(this.next() * (maxInclusive - minInclusive + 1))
      );
    },
  };
}

function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
