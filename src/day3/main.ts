import { expect, test } from "bun:test";
import { logIfTesting } from "../utils";

function partOne(s: string): number {
  const lines = s.split("\n").map((s) => s.trim().split(""));
  let acc = 0;
  lines.forEach((line) => {
    let max = 0;
    line.forEach((d1, i) => {
      line.slice(i + 1).forEach((d2) => {
        const n = Number(`${d1}${d2}`);
        if (n > max) max = n;
      });
    });
    acc += max;
  });

  return acc;
}

type getLargestArgs = {
  arr: string[];
  // how much deeper should we go
  left: number;
};

function partTwo(s: string): number {
  const lines = s.split("\n").map((s) => s.trim().split("").map(Number));
  let acc = 0;

  lines.forEach((line, line_idx) => {
    let numbers: number[] = [];
    line.forEach((nn, i) => {
      const left = line.length - i;
      const missing = 12 - numbers.length;
      for (let n_idx = 0; n_idx < numbers.length; n_idx++) {
        const no = numbers[n_idx]!;
        if (nn <= no) continue;
        const wtd = numbers.length - n_idx;
        const would_miss = missing + wtd;
        const to_delete = Math.min(numbers.length - n_idx, left - missing);
        // const to_delete = Math.min(numbers.length - n_idx, left);
        // console.log({ to_delete, n_idx, left, numbers, nn, no, would_miss });
        numbers = numbers.slice(0, numbers.length - to_delete);
        // console.log("after", numbers);
        break;
      }

      numbers.push(nn);
      numbers = numbers.slice(0, 12);
      // console.log(numbers);
    });
    // console.log(numbers);
    // console.log("------woooo-------");
    acc += Number(numbers.join(""));
  });
  return acc;
}

if (Bun.env.NODE_ENV === "test") {
  test("day 3 example", async () => {
    const example = (await Bun.file("./src/day3/example.txt").text()).trim();
    expect(partOne(example)).toBe(357);
  });
  test("day 3 pt. 2 example", async () => {
    const example = (await Bun.file("./src/day3/example.txt").text()).trim();
    expect(partTwo(example)).toBe(3121910778619);
  });
} else {
  const input = (await Bun.file("./src/day3/input.txt").text()).trim();
  console.log(partOne(input));
  console.log(partTwo(input));
}
