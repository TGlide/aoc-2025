import { expect, test } from "bun:test";

const example = `
L68
L30
R48
L5
R60
L55
L1
L99
R14
L82
`.trim();

function day1(s: string): number {
  let curr = 50;
  let zero_count = 0;
  s.split("\n").forEach((line) => {
    const dir = line[0];
    const mult = dir === "L" ? -1 : 1;
    const n = Number(line.substring(1));
    curr += n * mult;
    curr %= 100;
    if (curr < 0) curr = 100 + curr;
    if (curr === 0) zero_count++;

    console.log(dir, n, curr);
  });

  return zero_count;
}

test("day 1 example", () => {
  expect(day1(example)).toBe(3);
});
