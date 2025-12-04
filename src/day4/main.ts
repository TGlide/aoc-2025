import { expect, test } from "bun:test";
import { logIfTesting, readExample, readInput } from "../utils";

function partOne(s: string): number {
  let acc = 0;
  return acc;
}

function partTwo(s: string): number {
  let acc = 0;
  return acc;
}

if (Bun.env.NODE_ENV === "test") {
  test("day 4 example", async () => {
    const example = await readExample();
    expect(partOne(example)).toBe(0);
  });
  test("day 4 pt. 2 example", async () => {
    const example = await readExample();
    expect(partTwo(example)).toBe(0);
  });
} else {
  const input = await readInput();
  console.log(partOne(input));
  console.log(partTwo(input));
}
