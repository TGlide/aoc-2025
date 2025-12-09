export function isTruthy<T>(value: unknown): value is T {
  return !!value;
}
