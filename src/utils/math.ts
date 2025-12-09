export function randomRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function digits(n: number) {
  return Math.max(Math.floor(Math.log10(Math.abs(n))), 0) + 1;
}

export function isEven(n: number) {
  return n % 2 === 0;
}

export function getDeterminant(matrix: number[][]) {
  return matrix
    .map((row) => row.reduce((acc, curr) => acc * curr, 1))
    .reduce((acc, curr) => acc * curr, 1);
}

export function remainderMod(n: number, d: number) {
  const q = parseInt((n / d) as any); // truncates to lower magnitude
  return n - d * q;
}

export function remainderModBigInt(n: bigint, d: bigint) {
  const q = BigInt((n / d) as any); // truncates to lower magnitude
  return n - d * q;
}
