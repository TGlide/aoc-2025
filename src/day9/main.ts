import { expect, test } from "bun:test";
import {
  colors,
  combinations,
  logIfTesting,
  logMatrix,
  mark,
  readExample,
  readInput,
  traverseMatrix,
  unique,
  type MultiArray,
} from "../utils";

type Coord = MultiArray<number, 2>;

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
  logMatrix(matrix);
  console.log();

  // make walls
  coords.forEach((c1, i) => {
    const c2 = coords[(i + 1) % coords.length]!;
    matrix[c1[1]]![c1[0]] = "#";
    matrix[c2[1]]![c2[0]] = "#";
    between(c1, c2).forEach((c) => (matrix[c[1]]![c[0]] = "X"));
  });
  logMatrix(matrix);
  console.log();

  // fill it in
  matrix.forEach((line, row) => {
    const b = line.findIndex((item) => "#X".includes(item));
    const end = line.findLastIndex((item) => "#X".includes(item));
    if (b === -1 || end === -1) return;
    between([b, row], [end, row]).forEach((c) => (matrix[c[1]]![c[0]] = "X"));
  });
  logMatrix(matrix);
  console.log();

  return 0;

  return combinations(coords, 2).reduce((acc, [c1, c2]) => {
    const allCoords = [c1, c2, [c1[0], c2[1]], [c2[0], c1[1]]] as Coord[];
    const valid = allCoords.every(([col, row]) => {
      return matrix[row]![col] !== ".";
    });

    const a = area(c1, c2);
    console.log("c1:", c1);
    console.log("c2:", c2);
    console.log("All coords:", allCoords.join("; "));
    console.log("Area:", a);
    logMatrix(matrix, ({ row, col, char }) => {
      if (allCoords.some((c) => c[0] === col && c[1] === row)) {
        return mark("O", valid ? colors.green : colors.red);
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
    expect(partTwo(example)).toBe(35);
  });
} else {
  const input = await readInput();
  console.log(partOne(input));
  console.log(partTwo(input));
}
