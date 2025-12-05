import { expect, test } from "bun:test";
import {
  colors,
  logIfTesting,
  logMatrix,
  mark,
  readExample,
  readInput,
  TESTING,
} from "../utils";

const TP = "@";

function partOne(s: string): number {
  let lines = s.split("\n").map((line) => line.split(""));

  let acc = 0;
  lines.forEach((line, row) => {
    line.forEach((pos, col) => {
      if (pos !== TP) return;
      const adj = [
        [row - 1, col - 1],
        [row - 1, col],
        [row - 1, col + 1],
        [row, col - 1],
        [row, col + 1],
        [row + 1, col - 1],
        [row + 1, col],
        [row + 1, col + 1],
      ].filter(([r, c]) => {
        return lines[r!]?.[c!] === TP;
      });
      if (adj.length < 4) acc++;
      if (!TESTING) return;

      logMatrix(lines, (args) => {
        if (args.row === row && args.col === col) {
          return mark(args.char, colors.green);
        }
        if (adj.find((a) => a[0] === args.row && a[1] === args.col)) {
          return mark(args.char, colors.red);
        }
        return args.char;
      });
      console.log(`Row: ${row}, Col: ${col}`);
      console.log(`Adjacent TP: ${adj.length}`);
      console.log();
      console.log();
    });
  });

  return acc;
}

function partTwo(s: string): number {
  let lines = s.split("\n").map((line) => line.split(""));

  let acc = 0;
  let to_remove: Array<{ row: number; col: number }> = [];
  do {
    // remove
    if (TESTING) {
      logMatrix(lines, (args) => {
        if (to_remove.find((a) => a.row === args.row && a.col === args.col)) {
          return mark(args.char, colors.bgRed);
        }
        return args.char;
      });
      console.log(`Removing ${to_remove.length} toilet paper rolls...\n`);
    }

    to_remove.forEach((pos) => {
      lines[pos.row]![pos.col] = ".";
    });

    if (TESTING) {
      logMatrix(lines, (args) => {
        if (to_remove.find((a) => a.row === args.row && a.col === args.col)) {
          return mark(args.char, colors.bgGreen);
        }
        return args.char;
      });
      console.log("Removed!\n");
    }

    to_remove = [];

    // scan for candidates
    lines.forEach((line, row) => {
      line.forEach((pos, col) => {
        if (pos !== TP) return;
        const adj = [
          [row - 1, col - 1],
          [row - 1, col],
          [row - 1, col + 1],
          [row, col - 1],
          [row, col + 1],
          [row + 1, col - 1],
          [row + 1, col],
          [row + 1, col + 1],
        ].filter(([r, c]) => {
          return lines[r!]?.[c!] === TP;
        });
        if (adj.length < 4) {
          acc++;
          to_remove.push({ row, col });
        }
        if (!TESTING) return;

        // logMatrix(lines, (args) => {
        //   if (args.row === row && args.col === col) {
        //     return mark(args.char, colors.green);
        //   }
        //   if (adj.find((a) => a[0] === args.row && a[1] === args.col)) {
        //     return mark(args.char, colors.red);
        //   }
        //   return args.char;
        // });
        // console.log(`Row: ${row}, Col: ${col}`);
        // console.log(`Adjacent TP: ${adj.length}`);
        // console.log();
        // console.log();
      });
    });
  } while (to_remove.length > 0);

  return acc;
}

if (Bun.env.NODE_ENV === "test") {
  test("day 4 example", async () => {
    const example = await readExample();
    expect(partOne(example)).toBe(13);
  });
  test("day 4 pt. 2 example", async () => {
    const example = await readExample();
    expect(partTwo(example)).toBe(43);
  });
} else {
  const input = await readInput();
  console.log(partOne(input));
  console.log(partTwo(input));
}
