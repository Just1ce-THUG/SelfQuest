declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;

declare function expect<T>(actual: T): {
  toBe(expected: T): void;
  toBeCloseTo(expected: number, precision?: number): void;
};
