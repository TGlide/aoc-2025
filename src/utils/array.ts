export type MultiArray<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _BuildTuple<T, N, []>
  : never;

type _BuildTuple<
  T,
  N extends number,
  R extends readonly unknown[],
> = R["length"] extends N ? R : _BuildTuple<T, N, readonly [T, ...R]>;

export function combinations<T, N extends number>(
  arr: T[],
  n: N,
): Array<MultiArray<T, N>> {
  let res: Array<MultiArray<T, N>> = [];
  arr.forEach((item, i) => {
    if (n === 1) return res.push([item] as any);
    const c = combinations(arr.slice(i + 1), n - 1);
    c.forEach((a) => res.push([item, ...a] as any));
  });
  return res;
}

export function multicombinations<T, N extends number>(
  arr: T[],
  n: N,
): Array<MultiArray<T, N>> {
  let res: Array<MultiArray<T, N>> = [];
  arr.forEach((item, i) => {
    if (n === 1) return res.push([item] as any);
    const c = multicombinations(arr.slice(i), n - 1);
    c.forEach((a) => res.push([item, ...a] as any));
  });
  return res;
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function first<T>(arr: T[]) {
  return arr[0];
}

export function last<T>(arr: T[]) {
  return arr[arr.length - 1];
}

export function middle<T>(arr: T[]) {
  return arr[Math.floor(arr.length / 2)];
}

export function swap<T>(a: number, b: number, arr: T[]): T[] {
  const newArr = [...arr];
  const temp = newArr[a];
  newArr[a] = newArr[b]!;
  newArr[b] = temp!;
  return newArr;
}

export function remove<T>(arr: T[], idx: number): T[] {
  return arr.filter((_, i) => i !== idx);
}

export function sum(arr: number[]): number {
  return arr.reduce((acc, curr) => acc + curr, 0);
}

export function getIdxAt(idx: number, length: number) {
  if (idx >= 0) return idx % length;
  return length + (idx % length);
}

export function compareArr(arr1: unknown[], arr2: unknown[]): boolean {
  return arr1.every((item, i) => item === arr2[i]);
}

