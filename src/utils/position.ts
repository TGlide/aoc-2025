export type Position = { row: number; col: number };

export function hasPosition(
  positions: Iterable<Position>,
  pos: Position,
): boolean {
  return [...positions].some((p) => p.row === pos.row && p.col === pos.col);
}

export function isInBounds(pos: Position, matrix: unknown[][]) {
  const totalRows = matrix.length;
  const totalCols = matrix[0]?.length ?? 0;

  return (
    pos.row >= 0 && pos.row < totalRows && pos.col >= 0 && pos.col < totalCols
  );
}

export function getAdjacent(pos: Position) {
  return [
    { row: pos.row - 1, col: pos.col },
    { row: pos.row, col: pos.col + 1 },
    { row: pos.row + 1, col: pos.col },
    { row: pos.row, col: pos.col - 1 },
  ];
}

export function getAdjacentInMatrix(pos: Position, matrix: unknown[][]) {
  return [
    { row: pos.row - 1, col: pos.col },
    { row: pos.row, col: pos.col + 1 },
    { row: pos.row + 1, col: pos.col },
    { row: pos.row, col: pos.col - 1 },
  ].filter((p) => isInBounds(p, matrix));
}

export function distance(pos1: Position, pos2: Position) {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

export function isEqualPos(pos1: Position, pos2: Position) {
  return pos1.row === pos2.row && pos1.col === pos2.col;
}

export function isPosition(pos: unknown): pos is Position {
  return (
    typeof pos === "object" && pos !== null && "row" in pos && "col" in pos
  );
}

export type PosKey = string;

export function getPosKey(pos: Position) {
  return `pos:{${pos.row},${pos.col}}`;
}

export function getPos(pk: PosKey): Position {
  const [row, col] = /pos:\{(\d+),(\d+)\}/.exec(pk)?.slice(1, 3) ?? [];
  return { row: Number(row), col: Number(col) };
}
