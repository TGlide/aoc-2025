import { expect, test } from "bun:test";
import { logIfTesting, TESTING } from "@/utils/testing.js";
import { readExample, readInput } from "@/utils/file-io.js";
import { combinations, unique } from "@/utils/array.js";
import { simpleLogMatrix, traverseMatrix } from "@/utils/matrix.js";
import { colors, mark } from "@/utils/colors.js";
import { getNeighbors, type Coord } from "@/utils/coords";
import { waitForKeypress } from "@/utils/tui";
import { MatrixRenderer, type RGB } from "@/utils/terminal-image";

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
  // pairs.sort((a, b) => b.maxArea - a.maxArea);

  // Colors for visualization
  const COLORS = {
    outside: [20, 20, 25] as RGB,
    wall: [255, 180, 50] as RGB,
    inside: [50, 50, 50] as RGB,
    highlight: [80, 155, 80] as RGB,
    highlightInvalid: [255, 80, 80] as RGB,
    highlightInvalidOutside: [180, 50, 50] as RGB,
    best: [50, 200, 100] as RGB,
  };

  // Shared state for the renderer
  const highlightSet = new Set<string>();
  const bestCoordsSet = new Set<string>();
  let currentValid = false;
  let best = 0;
  let skipped = 0;

  // Color function for the matrix
  const getColor = (item: string, row: number, col: number): RGB => {
    const key = `${row},${col}`;

    // Best found so far
    if (bestCoordsSet.has(key)) {
      return COLORS.best;
    }

    // Current selection
    if (highlightSet.has(key)) {
      if (currentValid) return COLORS.highlight;
      return item === "."
        ? COLORS.highlightInvalidOutside
        : COLORS.highlightInvalid;
    }

    // Default colors
    if (item === "#") return COLORS.wall;
    if (item === "X") return COLORS.inside;
    if (item === ".") return COLORS.outside;
    return [60, 60, 70];
  };

  // Create persistent renderer (no flashing!)
  const renderer = new MatrixRenderer<string>({
    cellSize: 3,
    getColor,
  });

  // Throttle rendering
  let lastRender = 0;
  const throttleMs = 60;

  // Setup screen
  process.stdout.write("\x1b[?25l"); // Hide cursor
  process.stdout.write("\x1b[2J\x1b[H"); // Clear screen, move home

  // Reserve lines for status
  console.log(); // Line 1: status
  console.log(); // Line 2: progress
  console.log(); // Line 3: blank

  // Main computation loop
  for (let i = 0; i < pairs.length; i++) {
    const { r1, r2, maxArea } = pairs[i];

    // Early termination
    // if (maxArea <= best) {
    //   skipped = pairs.length - i;
    //   break;
    // }

    // Calculate bounds directly
    const minCol = Math.min(r1.r[0], r2.r[0]);
    const maxCol = Math.max(r1.r[0], r2.r[0]);
    const minRow = Math.min(r1.r[1], r2.r[1]);
    const maxRow = Math.max(r1.r[1], r2.r[1]);

    // Fast validity check
    const valid = isValidRect(minCol, maxCol, minRow, maxRow);

    // Update shared state
    highlightSet.clear();
    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        highlightSet.add(`${row},${col}`);
      }
    }
    currentValid = valid;

    if (valid && maxArea > best) {
      best = maxArea;
      bestCoordsSet.clear();
      for (let col = minCol; col <= maxCol; col++) {
        for (let row = minRow; row <= maxRow; row++) {
          bestCoordsSet.add(`${row},${col}`);
        }
      }
    }

    // Throttled render
    const now = Date.now();
    if (now - lastRender >= throttleMs) {
      // Update status lines (move to line 1, clear, print)
      process.stdout.write("\x1b[1;1H\x1b[2K");
      const statusColor = valid ? colors.green : colors.red;
      const validText = valid ? "VALID" : "INVALID";
      process.stdout.write(`Area: ${maxArea}  ${mark(validText, statusColor)}`);

      process.stdout.write("\x1b[2;1H\x1b[2K");
      process.stdout.write(
        `Best: ${best} | Progress: ${(((i + 1) * 100) / pairs.length).toFixed(2)}% ${i + 1}/${pairs.length}`,
      );

      // Move to line 4 for image
      process.stdout.write("\x1b[4;1H");

      // Render matrix as image (updates in place)
      renderer.render(matrix);

      lastRender = now;
    }
  }

  // Final render
  process.stdout.write("\x1b[1;1H\x1b[2K");
  process.stdout.write(mark(`Complete! Best area: ${best}`, colors.green));
  process.stdout.write("\x1b[2;1H\x1b[2K");
  process.stdout.write(`Checked: ${pairs.length - skipped}/${pairs.length}`);
  process.stdout.write("\x1b[4;1H");
  renderer.render(matrix);

  // Show cursor
  process.stdout.write("\x1b[?25h");

  if (TESTING) await waitForKeypress();

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
