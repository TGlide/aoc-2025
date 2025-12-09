/**
 * Typed Object.keys
 */
export function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export type ValueOf<T> = T[keyof T];

export function keyOf<T extends object>(obj: T, value: T[keyof T]): keyof T {
  const key = Object.keys(obj).find(
    (k) => k in obj && obj[k as keyof T] === value,
  );
  return key as keyof T;
}