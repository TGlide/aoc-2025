import type { Direction } from "@/utils/direction.js";
import type { Position } from "@/utils/position.js";
import { isInBounds, isPosition } from "@/utils/position.js";

type MatrixGenerator<T> = Position & {
  cb: (pos: Position) => T;
};
type MatrixInput<T> = string | T[][] | MatrixGenerator<T>;

export class Matrix<T> {
  private data: T[][];

  constructor(input: MatrixInput<T>) {
    if (typeof input === "string") {
      this.data = input.split("\n").map((line) => line.split("") as T[]);
    } else if (Array.isArray(input)) {
      this.data = input;
    } else {
      this.data = [...new Array(input.row)].map((_, row) => {
        return [...new Array(input.col)].map((_, col) => {
          return input.cb({ row, col });
        });
      });
    }
  }

  get size(): Position {
    return { row: this.data.length, col: this.data[0].length };
  }

  at({ row, col }: Position): T {
    return this.data[row][col];
  }

  set({ row, col }: Position, value: T): void {
    this.data[row][col] = value;
  }

  get value(): T[][] {
    return this.data;
  }

  has(pos: Position): boolean {
    return isInBounds(pos, this.data);
  }

  findOrThrow(value: T): Position {
    for (const { row, col, item } of this.traverse()) {
      if (item === value) return { row, col };
    }
    throw new Error(`Value ${value} not found in matrix`);
  }

  getAdjacent(pos: Position): (Position | null)[] {
    const positions = [
      { row: pos.row - 1, col: pos.col }, // up
      { row: pos.row, col: pos.col + 1 }, // right
      { row: pos.row + 1, col: pos.col }, // down
      { row: pos.row, col: pos.col - 1 }, // left
    ];
    return positions.map((p) => (isInBounds(p, this.data) ? p : null));
  }

  getAdjacentNotNull(pos: Position): Position[] {
    return this.getAdjacent(pos).filter(isPosition);
  }

  getAdjacentMap(pos: Position): Record<Direction, Position | null> {
    return {
      north: { row: pos.row - 1, col: pos.col },
      south: { row: pos.row + 1, col: pos.col },
      west: { row: pos.row, col: pos.col - 1 },
      east: { row: pos.row, col: pos.col + 1 },
    };
  }

  log(options?: Partial<LogMatrixOptions<T>>): void {
    logMatrix(this.data, options);
  }

  *traverse() {
    for (let row = 0; row < this.data.length; row++) {
      for (let col = 0; col < this.data[row].length; col++) {
        yield { row, col, item: this.data[row][col] };
      }
    }
  }
}

export function rotateMatrix<T>(matrix: T[][]) {
  const result: T[][] = [];
  const rows = matrix.length;
  const cols = matrix[0].length;

  for (let i = 0; i < cols; i++) {
    result[i] = [];
    for (let j = 0; j < rows; j++) {
      result[i][j] = matrix[j][i];
    }
  }

  return result;
}

export type Color =
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "gray"
  | "background-red"
  | "background-green"
  | "background-yellow"
  | "background-blue"
  | "background-magenta"
  | "background-cyan"
  | "background-white"
  | "background-gray";

export type HighlightPosition = {
  pos: Position;
  color: Color;
  override?: string;
};

const ANSI_COLORS: Record<Color, string> = {
  // Foreground colors
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  // Background colors
  "background-red": "\x1b[41m",
  "background-green": "\x1b[42m",
  "background-yellow": "\x1b[43m",
  "background-blue": "\x1b[44m",
  "background-magenta": "\x1b[45m",
  "background-cyan": "\x1b[46m",
  "background-white": "\x1b[47m",
  "background-gray": "\x1b[100m",
};

type ColorOverride = {
  content: string;
  color: Color;
};

type LogMatrixOptions<T> = {
  highlighted?: HighlightPosition[];
  override: (args: { item: T } & Position) => string | ColorOverride;
};

export function logMatrix<T>(
  matrix: T[][],
  options: Partial<LogMatrixOptions<T>> = {},
): void {
  const RESET = "\x1b[0m";
  const highlightMap = new Map(
    (options.highlighted ?? []).map((h) => [`${h.pos.row},${h.pos.col}`, h]),
  );

  const output = matrix
    .map((row, rowIndex) =>
      row
        .map((cell, colIndex) => {
          const key = `${rowIndex},${colIndex}`;
          const highlight = highlightMap.get(key);

          let content = cell as unknown;
          let color: Color | undefined;

          if (options.override) {
            const overrideResult = options.override({
              item: cell,
              row: rowIndex,
              col: colIndex,
            });
            if (
              typeof overrideResult === "object" &&
              "content" in overrideResult &&
              "color" in overrideResult
            ) {
              content = overrideResult.content;
              color = overrideResult.color;
            } else {
              content = overrideResult;
            }
          }

          if (!highlight) {
            return color
              ? `${ANSI_COLORS[color]}${content}${RESET}`
              : `${content}`;
          }
          const displayContent = highlight.override ?? content;
          return `${ANSI_COLORS[highlight.color]}${displayContent}${RESET}`;
        })
        .join(""),
    )
    .join("\n");

  console.log(output);
}

type MapStrFn<T> = (char: string) => T;
export function strToMatrix<T = string>(str: string, map?: MapStrFn<T>): T[][] {
  return str.split("\n").map((l) => {
    return l.split("").map(map ?? ((c) => c as T));
  });
}

export function traverseMatrix<T>(
  matrix: T[][],
  cb: (p: { row: number; col: number; item: T }) => void,
) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      cb({ row, col, item: matrix[row][col] });
    }
  }
}

export function* traverseMatrixGenerator<T>(matrix: T[][]) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      yield { row, col, item: matrix[row][col] };
    }
  }
}

export function invertMatrix<T>(matrix: T[][]): T[][] {
  let res: T[][] = [];
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row]!.length; col++) {
      if (!res[col]) res[col] = [];
      res[col]![row] = matrix[row]![col]!;
    }
  }

  return res;
}

// Backward compatibility function for simple transform-based logging
export function simpleLogMatrix<T>(
  matrix: T[][],
  transform?: (args: { char: T; row: number; col: number }) => string,
) {
  matrix.forEach((line, row) => {
    const output = line
      .map((char, col) => {
        if (!transform) return char;
        return transform({ char, row, col });
      })
      .join("");
    console.log(output);
  });
}
