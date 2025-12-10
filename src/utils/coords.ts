export type Coord = [number, number];

export function hasCoord(
  coords: Iterable<Coord>,
  coord: Coord,
): boolean {
  return [...coords].some((c) => c[0] === coord[0] && c[1] === coord[1]);
}

export function isInBounds(coord: Coord, matrix: unknown[][]): boolean {
  const [col, row] = coord;
  const totalRows = matrix.length;
  const totalCols = matrix[0]?.length ?? 0;

  return (
    row >= 0 && row < totalRows && col >= 0 && col < totalCols
  );
}

export function getAdjacent(coord: Coord): Coord[] {
  const [col, row] = coord;
  return [
    [col, row - 1],     // up
    [col + 1, row],     // right  
    [col, row + 1],     // down
    [col - 1, row],     // left
  ];
}

export function getAdjacentInMatrix(coord: Coord, matrix: unknown[][]): Coord[] {
  return getAdjacent(coord).filter((c) => isInBounds(c, matrix));
}

export function distance(coord1: Coord, coord2: Coord): number {
  return Math.abs(coord1[0] - coord2[0]) + Math.abs(coord1[1] - coord2[1]);
}

export function isEqualCoord(coord1: Coord, coord2: Coord): boolean {
  return coord1[0] === coord2[0] && coord1[1] === coord2[1];
}

export function isCoord(coord: unknown): coord is Coord {
  return (
    Array.isArray(coord) &&
    coord.length === 2 &&
    typeof coord[0] === 'number' &&
    typeof coord[1] === 'number'
  );
}

export type CoordKey = string;

export function getCoordKey(coord: Coord): string {
  return `coord:[${coord[0]},${coord[1]}]`;
}

export function getCoord(ck: CoordKey): Coord {
  const [col, row] = /coord:\[(\d+),(\d+)\]/.exec(ck)?.slice(1, 3) ?? [];
  return [Number(col), Number(row)];
}

// Additional utility functions specific to tuple format

export function add(coord1: Coord, coord2: Coord): Coord {
  return [coord1[0] + coord2[0], coord1[1] + coord2[1]];
}

export function subtract(coord1: Coord, coord2: Coord): Coord {
  return [coord1[0] - coord2[0], coord1[1] - coord2[1]];
}

export function multiply(coord: Coord, scalar: number): Coord {
  return [coord[0] * scalar, coord[1] * scalar];
}

export function manhattanDistance(coord1: Coord, coord2: Coord): number {
  return Math.abs(coord1[0] - coord2[0]) + Math.abs(coord1[1] - coord2[1]);
}

export function getNeighbors(coord: Coord, includeDiagonals = false): Coord[] {
  const [col, row] = coord;
  const neighbors: Coord[] = [
    [col, row - 1],     // up
    [col + 1, row],     // right  
    [col, row + 1],     // down
    [col - 1, row],     // left
  ];

  if (includeDiagonals) {
    neighbors.push(
      [col - 1, row - 1], // top-left
      [col + 1, row - 1], // top-right
      [col - 1, row + 1], // bottom-left
      [col + 1, row + 1], // bottom-right
    );
  }

  return neighbors;
}

export function getNeighborsInMatrix(coord: Coord, matrix: unknown[][], includeDiagonals = false): Coord[] {
  return getNeighbors(coord, includeDiagonals).filter((c) => isInBounds(c, matrix));
}

export function coordToString(coord: Coord): string {
  return `[${coord[0]},${coord[1]}]`;
}

export function coordFromString(str: string): Coord {
  const match = str.match(/\[(\d+),(\d+)\]/);
  if (!match) throw new Error(`Invalid coord string: ${str}`);
  return [Number(match[1]), Number(match[2])];
}