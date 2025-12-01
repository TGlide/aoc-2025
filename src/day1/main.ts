import { expect, test } from "bun:test";
import { logIfTesting } from "../utils";

function partOne(s: string): number {
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

    logIfTesting(dir, n, curr);
  });

  logIfTesting("Final zero count:", zero_count);
  return zero_count;
}

function partTwo(s: string): number {
  let curr = 50;
  let zero_count = 0;
  s.split("\n").forEach((line) => {
    const prev = curr;

    const dir = line[0];
    const mult = dir === "L" ? -1 : 1;
    let n = Number(line.substring(1));
    zero_count += Math.floor(n / 100);
    n %= 100;

    curr += n * mult;

    let toLog = "";
    if (prev !== 0 && (curr >= 100 || curr <= 0)) {
      zero_count++;
      toLog += "another zero!";
    }
    curr %= 100;
    if (curr < 0) curr = 100 + curr;

    logIfTesting(toLog, `prev: ${prev}`, dir, n, `curr: ${curr}`);
  });

  logIfTesting("Final zero count:", zero_count);
  return zero_count;
}

if (Bun.env.NODE_ENV === "test") {
  test("day 1 example", async () => {
    const example = (await Bun.file("./src/day1/example.txt").text()).trim();
    expect(partOne(example)).toBe(3);
  });
  test("day 1 pt. 2 example", async () => {
    const example = (await Bun.file("./src/day1/example.txt").text()).trim();
    expect(partTwo(example)).toBe(6);
  });
} else {
  const input = (await Bun.file("./src/day1/input.txt").text()).trim();
  console.log(partOne(input));
  console.log(partTwo(input));
}
