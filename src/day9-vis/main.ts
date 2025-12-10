import { expect, test } from "bun:test";
import { logIfTesting, TESTING } from "@/utils/testing.js";
import { readExample, readInput } from "@/utils/file-io.js";
import { combinations, unique } from "@/utils/array.js";
import { simpleLogMatrix, traverseMatrix } from "@/utils/matrix.js";
import { colors, mark } from "@/utils/colors.js";
import { getNeighbors, type Coord } from "@/utils/coords";
import { TUI, waitForKeypress } from "@/utils/tui";

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

async function partTwo(s: string): Promise<number> {
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

  // Use 2D boolean array for O(1) validity checks - faster than Set with string keys
  const matrixHeight = matrix.length;
  const matrixWidth = matrix[0].length;
  const isOutside: boolean[][] = new Array(matrixHeight);
  for (let row = 0; row < matrixHeight; row++) {
    isOutside[row] = new Array(matrixWidth);
    for (let col = 0; col < matrixWidth; col++) {
      isOutside[row][col] = matrix[row][col] === ".";
    }
  }

  // Optimized validity check using direct array access (no string keys!)
  const isValidRect = (
    minCol: number,
    maxCol: number,
    minRow: number,
    maxRow: number,
  ): boolean => {
    for (let row = minRow; row <= maxRow; row++) {
      const rowArr = isOutside[row];
      for (let col = minCol; col <= maxCol; col++) {
        if (rowArr[col]) return false;
      }
    }
    return true;
  };

  // Pre-compute all pairs with their potential areas, sorted descending
  // This allows early termination when best > remaining potential
  const pairs: Array<{
    r1: (typeof ranks)[0];
    r2: (typeof ranks)[0];
    maxArea: number;
  }> = [];

  for (let i = 0; i < ranks.length; i++) {
    for (let j = i + 1; j < ranks.length; j++) {
      pairs.push({
        r1: ranks[i],
        r2: ranks[j],
        maxArea: area(ranks[i].c, ranks[j].c),
      });
    }
  }

  // Sort by area descending - check biggest first, prune more
  pairs.sort((a, b) => b.maxArea - a.maxArea);

  // Use TUI for smooth visualization
  const tui = new TUI<string>({
    title: "Day 9 - Rectangle Search",
    throttleMs: 40,
    showFps: true,
  }).init();

  // Shared state for the transform function (updated by computation, read by renderer)
  const highlightSet = new Set<string>();
  const bestCoordsSet = new Set<string>();
  let currentValid = false;
  let best = 0;

  // Create transform function ONCE - reads from shared state
  const transform = ({
    item,
    row,
    col,
  }: {
    item: string;
    row: number;
    col: number;
  }) => {
    const key = `${row},${col}`;

    // Highlight best found so far (O(1) Set lookup)
    if (bestCoordsSet.has(key)) {
      return { content: "O", color: colors.bgGreen };
    }

    // Current selection (O(1) Set lookup)
    if (highlightSet.has(key)) {
      const color = currentValid
        ? colors.green
        : item === "."
          ? colors.bgRed
          : colors.red;
      return { content: "O", color };
    }

    // Default coloring for matrix cells
    if (item === "#") return { content: "#", color: colors.yellow };
    if (item === "X") return { content: "X", color: colors.cyan };
    if (item === ".") return { content: ".", color: colors.brightBlack };
    return item;
  };

  tui.setMatrix(matrix, transform);

  let skipped = 0;

  // Main computation loop - renders only when throttle allows
  for (let i = 0; i < pairs.length; i++) {
    const { r1, r2, maxArea } = pairs[i];

    // Early termination: if best area >= this pair's max possible area, skip rest
    // (pairs are sorted by maxArea descending)
    if (maxArea <= best) {
      skipped = pairs.length - i;
      break;
    }

    // Calculate bounds directly
    const minCol = Math.min(r1.r[0], r2.r[0]);
    const maxCol = Math.max(r1.r[0], r2.r[0]);
    const minRow = Math.min(r1.r[1], r2.r[1]);
    const maxRow = Math.max(r1.r[1], r2.r[1]);

    // Fast validity check with early exit
    const valid = isValidRect(minCol, maxCol, minRow, maxRow);

    // Update shared state for TUI
    highlightSet.clear();
    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        highlightSet.add(`${row},${col}`);
      }
    }

    currentValid = valid;

    // Update TUI state and request render (throttled)
    tui
      .setStatus(
        `Checking: [${r1.c}] -> [${r2.c}]  Area: ${maxArea}  ${mark(valid ? "VALID" : "INVALID", valid ? colors.green : colors.red)}`,
        `Best: ${best} | Skipped: ${skipped}`,
      )
      .setProgress(i + 1, pairs.length)
      .invalidateMatrix()
      .requestRender();

    if (valid && maxArea > best) {
      best = maxArea;
      bestCoordsSet.clear();
      for (let col = minCol; col <= maxCol; col++) {
        for (let row = minRow; row <= maxRow; row++) {
          bestCoordsSet.add(`${row},${col}`);
        }
      }
    }
  }

  tui
    .setStatus(
      `Complete! Best area: ${best}`,
      `Checked: ${pairs.length - skipped}/${pairs.length} | Press any key...`,
    )
    .setProgress(pairs.length, pairs.length)
    .render();

  // Wait for keypress before cleanup so user can see result
  if (TESTING) await waitForKeypress();
  tui.cleanup();

  return best;
}

if (Bun.env.NODE_ENV === "test") {
  test("example", async () => {
    const example = await readExample();
    expect(partOne(example)).toBe(50);
  });
  test("pt. 2 example", async () => {
    const example = await readExample();
    expect(await partTwo(example)).toBe(24);
  });
} else {
  const input = await readInput();
  console.log(partOne(input));
  console.log(await partTwo(input));
}
