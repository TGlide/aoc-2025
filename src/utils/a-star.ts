import { last } from "./array";
import type { Matrix } from "./matrix";
import {
  distance,
  getPos,
  getPosKey,
  hasPosition,
  isEqualPos,
  type Position,
  type PosKey,
} from "./position";
import { keys } from "./types";

type NodeKey = string;

type Node<Extra = {}> = {
  pos: Position;
} & Extra;

type NodeWithScore<T> = Node<T> & {
  score: number;
};

function getNodeKey<T>(node: Node<T>): NodeKey {
  const objKeys = keys(node)
    .filter((k) => k !== "score")
    .toSorted();

  return objKeys
    .map((k) => {
      return k === "pos" ? getPosKey(node.pos) : `${k as string}:${node[k]}`;
    })
    .join(";");
}

function getPosFromPosKey(pk: PosKey): Position {
  const [row, col] = /pos:\{(\d+),(\d+)\}/.exec(pk)?.slice(1, 3) ?? [];
  return { row: Number(row), col: Number(col) };
}

function getPosKeyFromNodeKey(nodeKey: NodeKey): PosKey {
  return getPosKey(getPosFromPosKey(nodeKey));
}

type UpdateScoreArgs<T> = {
  node: NodeWithScore<T>;
  parent: Node<T>;
};

type AStarArgs<Extra = {}> = {
  matrix: Matrix<unknown>;
  start: Node<Extra>;
  end: Node<Extra>;
  getNext: (current: NodeWithScore<Extra>) => NodeWithScore<Extra>[];
};

export class AStar<Extra = {}> {
  args: AStarArgs<Extra>;

  queue: Node<Extra>[] = [];
  visited: Set<NodeKey> = new Set();

  scoreMap: Record<NodeKey, number> = {};
  parentMap: Record<NodeKey, NodeKey[]> = {};

  constructor(args: AStarArgs<Extra>) {
    this.args = args;
  }

  private findInsertionIndex(node: Node<Extra>) {
    let left = 0;
    let right = this.queue.length;

    const nodeScore = this.scoreMap[getNodeKey(node)]!;
    const nodeDistToEnd = distance(node.pos, this.args.end.pos);
    const nodeFScore = nodeScore + nodeDistToEnd;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const midKey = getNodeKey(this.queue[mid]!);
      const midPos = this.queue[mid]!.pos;
      const midScore = this.scoreMap[midKey]!;
      const midDistToEnd = distance(midPos, this.args.end.pos);
      const midFScore = midScore + midDistToEnd;

      if (midFScore > nodeFScore) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    return left;
  }

  private push(node: Node<Extra>) {
    const nodeKey = getNodeKey(node);
    if (this.visited.has(nodeKey)) return;

    const currIndex = this.queue.findIndex((n) => getNodeKey(n) === nodeKey);
    if (currIndex !== -1) {
      this.queue.splice(currIndex, 1);
    }

    const index = this.findInsertionIndex(node);
    this.queue.splice(index, 0, node);
  }

  private get next() {
    const next = this.queue.shift();
    if (!next) return null;
    this.visited.add(getNodeKey(next));
    return next;
  }

  private updateScore({ parent, node }: UpdateScoreArgs<Extra>) {
    const [nk, pk] = [getNodeKey(node), getNodeKey(parent)];
    if (!(nk in this.parentMap)) this.parentMap[nk] = [pk];

    const prevScore = this.scoreMap[getNodeKey(node)] ?? Infinity;

    if (node.score < prevScore) {
      this.scoreMap[nk] = node.score;
      this.parentMap[nk] = [pk];
    } else if (node.score === prevScore) {
      this.parentMap[nk].push(pk);
    }
  }

  calculate() {
    this.scoreMap = {
      [getNodeKey(this.args.start)]: 0,
    };

    this.parentMap = {};

    this.queue = [];
    this.push(this.args.start);

    let count = 0;

    while (this.queue.length) {
      const node = this.next!;
      const nodeKey = getNodeKey(node);

      const score = this.scoreMap[nodeKey] ?? Infinity;

      const nextNodes = this.args.getNext({ ...node, score });

      nextNodes.forEach((n) => {
        this.updateScore({ node: n, parent: node });
        this.push(n);
      });

      count++;
      // console.clear();
      // this.args.matrix.log({
      //   highlighted: [...this.visited].map((k) => ({
      //     pos: getPos(k),
      //     color: "background-cyan",
      //   })),
      // });
      // await new Promise((r) => setTimeout(r, 1));
    }

    return this.minScore;
  }

  get endKeys() {
    return keys(this.scoreMap).reduce<NodeKey[]>((acc, curr) => {
      if (!curr.includes(getPosKey(this.args.end.pos))) return acc;
      return [...acc, curr];
    }, []);
  }

  get minScore() {
    return this.endKeys.reduce<number>((acc, curr) => {
      const s = this.scoreMap[curr];
      return s < acc ? s : acc;
    }, Infinity);
  }

  getBestPath(): Position[] {
    const minScore = this.minScore;
    let curr = this.endKeys.reduce<NodeKey>((acc, curr) => {
      const s = this.scoreMap[curr];
      if (s === minScore) return curr;
      return acc;
    }, this.endKeys[0]);

    const path: Position[] = [getPosFromPosKey(curr)];
    while (curr in this.parentMap) {
      curr = this.parentMap[curr][0];
      const pos = getPosFromPosKey(curr);
      path.push(pos);
      if (isEqualPos(this.args.start.pos, pos)) break;
    }

    return path.toReversed();
  }

  getBestPaths(): Position[][] {
    const minScore = this.minScore;
    const endKeys = this.endKeys.reduce<NodeKey[]>((acc, curr) => {
      const s = this.scoreMap[curr];
      if (s === minScore) return [...acc, curr];
      return acc;
    }, []);

    const paths: NodeKey[][] = endKeys.map((k) => [k]);
    while (
      paths.some(
        (k) => !hasPosition(k.map(getPosFromPosKey), this.args.start.pos),
      )
    ) {
      const path = paths.shift()!;
      const parents = this.parentMap[last(path)];
      parents.forEach((p) => {
        paths.push([...path, p]);
      });
    }

    return paths.map((k) => k.map(getPosFromPosKey).toReversed());
  }

  getOptimalPositions() {
    const seats = new Set<PosKey>();
    const visited = new Set<NodeKey>();
    const stack = [
      ...this.endKeys.filter((k) => {
        return this.scoreMap[k] === this.minScore;
      }),
    ];
    while (stack.length) {
      const nk = stack.pop()!;
      visited.add(nk);
      seats.add(getPosKeyFromNodeKey(nk));
      const parents = this.parentMap[nk] ?? [];
      parents.filter((k) => !visited.has(k)).forEach((p) => stack.push(p));
    }

    return [...seats].map((pk) => getPosFromPosKey(pk));
  }

  logMatrixWithBestPath() {
    this.args.matrix.log({
      highlighted: this.getBestPath().map((pos) => ({
        pos,
        color: "background-cyan",
      })),
    });
  }

  logMatrixWithPath() {
    this.args.matrix.log({
      highlighted: this.getOptimalPositions().map((pos) => ({
        pos,
        color: "background-cyan",
      })),
    });
  }
}
