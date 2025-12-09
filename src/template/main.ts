import { expect, test } from "bun:test";
import { readExample, readInput } from "../utils";

function partOne(s: string): number {
  return 0;
}

function partTwo(s: string): number {
  return 0;
}

if (Bun.env.NODE_ENV === "test") {
  test("example", async () => {
    const example = await readExample();
    expect(partOne(example)).toBe(0);
  });
  test("pt. 2 example", async () => {
    const example = await readExample();
    expect(partTwo(example)).toBe(0);
  });
} else {
  const input = await readInput();
  console.log(partOne(input));
  console.log(partTwo(input));
}
