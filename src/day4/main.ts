import { expect, test } from "bun:test";
import { logIfTesting } from "../utils";

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
    const example = (await Bun.file("./src/day4/example.txt").text()).trim();
    expect(partOne(example)).toBe(0);
  });
  test("day 4 pt. 2 example", async () => {
    const example = (await Bun.file("./src/day4/example.txt").text()).trim();
    expect(partTwo(example)).toBe(0);
  });
} else {
  const input = (await Bun.file("./src/day4/input.txt").text()).trim();
  console.log(partOne(input));
  console.log(partTwo(input));
}
