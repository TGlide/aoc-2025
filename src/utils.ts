export let TESTING = Bun.env.NODE_ENV === "test";
// TESTING = true;

export const logIfTesting: typeof console.log = (...args) => {
  if (!TESTING) return;
  return console.log(...args);
};

function getCallerDir(): string {
  const err = new Error();
  const stack = err.stack!.split("\n");
  // Find the first stack frame that's not in utils.ts
  for (const line of stack) {
    const match =
      line.match(/at .+ \((.+):\d+:\d+\)/) || line.match(/at (.+):\d+:\d+/);
    if (match?.[1] && !match[1].includes("utils.ts")) {
      const filePath = match[1];
      return filePath.substring(0, filePath.lastIndexOf("/"));
    }
  }
  throw new Error("Could not determine caller directory");
}

export async function readInput(): Promise<string> {
  const dir = getCallerDir();
  return (await Bun.file(`${dir}/input.txt`).text()).trim();
}

export async function readExample(): Promise<string> {
  const dir = getCallerDir();
  return (await Bun.file(`${dir}/example.txt`).text()).trim();
}

export const colors = {
  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Bright foreground colors
  brightBlack: "\x1b[90m",
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",

  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",

  // Reset
  reset: "\x1b[0m",
};

export type ValueOf<T> = T[keyof T];

export function mark(str: string, color: ValueOf<typeof colors>) {
  return `${color}${str}${colors.reset}`;
}

export function logMatrix<T>(
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

export function clearTerminal(): void {
  console.log("\x1b[2J\x1b[H");
}

export function invertMatrix<T>(matrix: T[][]): T[][] {
  let res: T[][] = [];
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row]!.length; col++) {
      if (!res[col]) res[col] = [];
      res[col]![row] = matrix[row]![col] as any;
    }
  }

  return res;
}

export type MultiArray<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _BuildTuple<T, N, []>
  : never;

type _BuildTuple<
  T,
  N extends number,
  R extends readonly unknown[],
> = R["length"] extends N ? R : _BuildTuple<T, N, readonly [T, ...R]>;

export function combinations<T, N extends number>(
  arr: T[],
  n: N,
): Array<MultiArray<T, N>> {
  let res: Array<MultiArray<T, N>> = [];
  arr.forEach((item, i) => {
    if (n === 1) return res.push([item] as any);
    const c = combinations(arr.slice(i + 1), n - 1);
    c.forEach((a) => res.push([item, ...a] as any));
  });
  return res;
}

export function traverseMatrix<T>(
  matrix: T[][],
  cb: (p: { row: number; col: number; item: T }) => void,
) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row]!.length; col++) {
      cb({ row, col, item: matrix[row]![col]! });
    }
  }
}

export function* traverseMatrixGenerator<T>(matrix: T[][]) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row]!.length; col++) {
      yield { row, col, item: matrix[row]![col]! };
    }
  }
}
