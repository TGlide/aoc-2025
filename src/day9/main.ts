import { expect, test } from "bun:test";
import { logIfTesting } from "@/utils/testing.js";
import { readExample, readInput } from "@/utils/file-io.js";
import { combinations, unique } from "@/utils/array.js";
import { simpleLogMatrix, traverseMatrix } from "@/utils/matrix.js";
import { colors, mark } from "@/utils/colors.js";
import type { MultiArray } from "@/utils/array.js";
import { getAdjacent, getAdjacentInMatrix } from "@/utils/position";
import { getNeighbors, getNeighborsInMatrix, type Coord } from "@/utils/coords";

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
  // const rows = unique(coords.map((c) => c[0])).toSorted((a, b) => a - b);
  // const cols = unique(coords.map((c) => c[1])).toSorted((a, b) => a - b);
  // coords.forEach((coord, i) => {
  //   coords[i] = [rows.indexOf(coord[0]!) + 1, cols.indexOf(coord[1]!) + 1];
  // });

  const [w, h] = coords.reduce(
    (acc, c) => {
      acc.forEach((_, i) => {
        const ac = c.map((n) => n + 1);
        if (ac[i]! > acc[i]!) acc[i] = ac[i]!;
      });
      return acc;
    },
    [0, 0],
  );

  // lets do this the hard way. cool for visualizing.
  console.log("building matrix with sizes", w, h);
  console.log("...fuck thats big\n");
  const matrix = new Array(h + 1)
    .fill(0)
    .map((_) => new Array(w + 1).fill("-")) as string[][];
  simpleLogMatrix(matrix);
  console.log();

  // make walls
  coords.forEach((c1, i) => {
    const c2 = coords[(i + 1) % coords.length]!;
    matrix[c1[1]]![c1[0]] = "#";
    matrix[c2[1]]![c2[0]] = "#";
    between(c1, c2).forEach((c) => (matrix[c[1]]![c[0]] = "X"));
  });
  simpleLogMatrix(matrix);
  console.log();

  // fill outside
  let queue = [[0, 0]] as Coord[];
  while (queue.length) {
    const next = queue.shift()!;
    const [row, col] = next;
    matrix[row][col] = ".";

    const toPush = getNeighbors(next).filter(([row, col]) => {
      return matrix[row]?.[col] === "-";
    });
    queue.push(...toPush);
  }
  traverseMatrix(matrix, ({ row, col, item }) => {
    if (item !== "-") return;
    matrix[row][col] = "X";
  });

  simpleLogMatrix(matrix);
  console.log();

  return combinations(coords, 2).reduce((acc, [c1, c2]) => {
    const allCoords = rect(c1, c2);
    const valid = allCoords.every(([col, row]) => {
      return matrix[row]![col] !== ".";
    });

    const a = area(c1, c2);
    console.log("c1:", c1);
    console.log("c2:", c2);
    console.log("All coords:", allCoords.join("; "));
    console.log("Area:", a);
    simpleLogMatrix(matrix, ({ row, col, char }) => {
      if (allCoords.some((c) => c[0] === col && c[1] === row)) {
        return mark(
          "O",
          valid ? colors.green : char === "." ? colors.bgRed : colors.red,
        );
      }
      return char;
    });
    if (!valid) {
      console.log(mark("INVALID", colors.red));
      console.log();
      return acc;
    }

    const toLog = [mark("VALID", colors.green)];
    if (a > acc) toLog.push(mark("NEW RECORD", colors.bgGreen));
    console.log(...toLog);
    console.log();

    return a > acc ? a : acc;
  }, 0);
  return 0;
}

if (Bun.env.NODE_ENV === "test") {
  test("example", async () => {
    const example = await readExample();
    expect(partOne(example)).toBe(256);
  });
  test("pt. 2 example", async () => {
    const example = await readExample();
    expect(partTwo(example)).toBe(66);
  });
} else {
  const input = await readInput();
  console.log(partOne(input));
  console.log(partTwo(input));
}
