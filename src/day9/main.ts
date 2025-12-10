import { expect, test } from "bun:test";
import { logIfTesting, TESTING } from "@/utils/testing.js";
import { readExample, readInput } from "@/utils/file-io.js";
import { combinations, unique } from "@/utils/array.js";
import { simpleLogMatrix, traverseMatrix } from "@/utils/matrix.js";
import { colors, mark } from "@/utils/colors.js";
import type { MultiArray } from "@/utils/array.js";
import { getAdjacent, getAdjacentInMatrix } from "@/utils/position";
import { getNeighbors, getNeighborsInMatrix, type Coord } from "@/utils/coords";
import { ProgressBar } from "@/utils/progress-bar";

function area(c1: Coord, c2: Coord) {
  const w = Math.abs(c1[0] - c2[0]) + 1;
  const h = Math.abs(c1[1] - c2[1]) + 1;
  return w * h;
}

function partOne(s: string): number {
  const coords = s.split("\n").map((l) => l.split(",").map(Number)) as [
    number,
    number,
  ][];

  return combinations(coords, 2).reduce((acc, [c1, c2]) => {
    const a = area(c1, c2);
    logIfTesting(c1, c2, a);
    return a > acc ? a : acc;
  }, 0);
}

// returns all the coords between two coords
function between(c1: Coord, c2: Coord): Coord[] {
  const i = c1[0] === c2[0] ? 0 : 1;
  const j = i === 0 ? 1 : 0;
  const d = Math.abs(c1[j] - c2[j]);
  const begin = c1[j] < c2[j] ? c1 : c2;

  return [
    ...new Array(d - 1).fill(0).map((_, k) => {
      const n = [0, 0];
      n[i] = c1[i];
      n[j] = begin[j] + k + 1;
      return n as unknown as Coord;
    }),
  ];
}

// returns all the coords of a rectangle
function rect(c1: Coord, c2: Coord): Coord[] {
  const minRow = Math.min(c1[0], c2[0]);
  const maxRow = Math.max(c1[0], c2[0]);
  const minCol = Math.min(c1[1], c2[1]);
  const maxCol = Math.max(c1[1], c2[1]);

  let res: Coord[] = [];
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      res.push([row, col]);
    }
  }
  return res;
}

function partTwo(s: string): number {
  const coords = s.split("\n").map((l) => l.split(",").map(Number)) as [
    number,
    number,
  ][];

  // compact coords
  const rows = unique(coords.map((c) => c[0])).toSorted((a, b) => a - b);
  const cols = unique(coords.map((c) => c[1])).toSorted((a, b) => a - b);
  const ranks: Array<{ r: Coord; c: Coord }> = [];
  coords.forEach((coord, i) => {
    ranks[i] = {
      c: coord,
      r: [rows.indexOf(coord[0]!) + 1, cols.indexOf(coord[1]!) + 1],
    };
  });

  const [w, h] = ranks.reduce(
    (acc, { r: c }) => {
      acc.forEach((_, i) => {
        const ac = c.map((n) => n + 1);
        if (ac[i]! > acc[i]!) acc[i] = ac[i]!;
      });
      return acc;
    },
    [0, 0],
  );

  // lets do this the hard way. cool for visualizing.
  logIfTesting("building matrix with sizes", w, h);
  const matrix = new Array(h + 1)
    .fill(0)
    .map((_) => new Array(w + 1).fill("-")) as string[][];
  // if (TESTING) simpleLogMatrix(matrix);
  logIfTesting();

  // make walls
  logIfTesting("making walls");
  ranks.forEach(({ r: c1 }, i) => {
    const c2 = ranks[(i + 1) % ranks.length]!.r;
    matrix[c1[1]]![c1[0]] = "#";
    matrix[c2[1]]![c2[0]] = "#";
    between(c1, c2).forEach((c) => (matrix[c[1]]![c[0]] = "X"));
  });
  // if (TESTING) simpleLogMatrix(matrix);
  logIfTesting();

  // fill outside
  logIfTesting("filling");
  const visited = new Set<string>();
  let queue = [[0, 0]] as Coord[];
  visited.add("0,0");

  while (queue.length) {
    const next = queue.shift()!;
    const [row, col] = next;
    matrix[row][col] = ".";

    for (const [nRow, nCol] of getNeighbors(next)) {
      const key = `${nRow},${nCol}`;
      if (matrix[nRow]?.[nCol] === "-" && !visited.has(key)) {
        visited.add(key);
        queue.push([nRow, nCol]);
      }
    }
  }
  traverseMatrix(matrix, ({ row, col, item }) => {
    if (item !== "-") return;
    matrix[row][col] = "X";
  });

  if (TESTING) simpleLogMatrix(matrix);
  logIfTesting();

  const c = combinations(ranks, 2);
  const progress = new ProgressBar({
    total: c.length,
  });
  return c.reduce((acc, [r1, r2], i) => {
    progress.update(i + 1);
    const allranks = rect(r1.r, r2.r);
    const valid = allranks.every(([col, row]) => {
      return matrix[row]![col] !== ".";
    });

    const a = area(r1.c, r2.c);
    logIfTesting("c1:", r1);
    logIfTesting("c2:", r2);
    logIfTesting("All ranks:", allranks.join("; "));
    logIfTesting("Area:", a);
    if (TESTING)
      simpleLogMatrix(matrix, ({ row, col, char }) => {
        if (allranks.some((c) => c[0] === col && c[1] === row)) {
          return mark(
            "O",
            valid ? colors.green : char === "." ? colors.bgRed : colors.red,
          );
        }
        return char;
      });
    if (!valid) {
      logIfTesting(mark("INVALID", colors.red));
      logIfTesting();
      return acc;
    }

    const toLog = [mark("VALID", colors.green)];
    if (a > acc) toLog.push(mark("NEW RECORD", colors.bgGreen));
    logIfTesting(...toLog);
    logIfTesting();

    return a > acc ? a : acc;
  }, 0);
}

if (Bun.env.NODE_ENV === "test") {
  test("example", async () => {
    const example = await readExample();
    expect(partOne(example)).toBe(50);
  });
  test("pt. 2 example", async () => {
    const example = await readExample();
    expect(partTwo(example)).toBe(24);
  });
} else {
  const input = await readInput();
  console.log(partOne(input));
  console.log(partTwo(input));
}
