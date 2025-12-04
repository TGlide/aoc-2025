import { expect, test } from "bun:test";
import { logIfTesting } from "../utils";

function partOne(s: string): number {
  let ranges = s.split(",").map((x) => x.split("-").map(Number)) as Array<
    [number, number]
  >;
  let acc = 0;

  const regex = /^(\d+)(.*)(.*\1)$/;
  ranges.forEach(([lb, ub]) => {
    for (let n = lb; n <= ub; n++) {
      const nStr = n.toString();
      const m = regex.exec(nStr);
      if (!m || m[2]) continue;
      logIfTesting(n);
      acc += n;
    }
  });

  return acc;
}

function partTwo(s: string): number {
  let ranges = s.split(",").map((x) => x.split("-").map(Number)) as Array<
    [number, number]
  >;
  let acc = 0;

  const regex = /^(\d+?)(\1*)$/;
  ranges.forEach(([lb, ub]) => {
    for (let n = lb; n <= ub; n++) {
      const nStr = n.toString();
      const m = regex.exec(nStr);
      if (!m || !m[2]) continue;
      logIfTesting(n, m);
      acc += n;
    }
  });

  return acc;
}

if (Bun.env.NODE_ENV === "test") {
  test("day 2 example", async () => {
    const example = (await Bun.file("./src/day2/example.txt").text()).trim();
    expect(partOne(example)).toBe(1227775554);
  });
  test("day 2 pt. 2 example", async () => {
    const example = (await Bun.file("./src/day2/example.txt").text()).trim();
    expect(partTwo(example)).toBe(4174379265);
  });
} else {
  const input = (await Bun.file("./src/day2/input.txt").text()).trim();
  console.log(partOne(input));
  console.log(partTwo(input));
}
