import { expect, test } from "bun:test";
import { logIfTesting } from "@/utils/testing.js";
import { readExample, readInput } from "@/utils/file-io.js";

type Coord = { x: number; y: number; z: number };

function distance(c1: Coord, c2: Coord): number {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const dz = c2.z - c1.z;
  return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
}

function partOne(s: string, connections: number): number {
  const coords = s.split("\n").map((line) => {
    const [x, y, z] = line.split(",").map(Number);
    return { x, y, z };
  }) as Coord[];

  // dist, idx1, idx2
  const distances: [number, number, number][] = [];
  coords.forEach((c1, i1) => {
    coords.slice(i1 + 1).forEach((c2, i2) => {
      distances.push([distance(c1, c2), i1, i1 + i2 + 1]);
    });
  });
  distances.sort(([d1], [d2]) => d1 - d2);

  const circuits = coords.map((_, i) => [i]);

  let count = 0;
  while (distances.length && count < connections) {
    count++;
    const [d, i1, i2] = distances.shift()!;

    const j1 = circuits.findIndex((c) => c.some((i) => i === i1));
    const cc1 = circuits[j1];
    const j2 = circuits.findIndex((c) => c.some((i) => i === i2));
    const cc2 = circuits[j2];

    if (cc1 === cc2) {
    } else {
      circuits.splice(j2, 1);
      cc1?.push(...cc2!);
    }
    logIfTesting(
      `join ${i1} + ${i2} -> ${circuits.filter((c) => c.length > 1).map((c) => `[${c.join(", ")}]`)}`,
    );
  }

  circuits.sort((c1, c2) => c2.length - c1.length);
  logIfTesting(circuits);

  return circuits.slice(0, 3).reduce((acc, curr) => acc * curr.length, 1);
}

function partTwo(s: string): number {
  const coords = s.split("\n").map((line) => {
    const [x, y, z] = line.split(",").map(Number);
    return { x, y, z };
  }) as Coord[];

  // dist, idx1, idx2
  const distances: [number, number, number][] = [];
  coords.forEach((c1, i1) => {
    coords.slice(i1 + 1).forEach((c2, i2) => {
      distances.push([distance(c1, c2), i1, i1 + i2 + 1]);
    });
  });
  distances.sort(([d1], [d2]) => d1 - d2);

  const circuits = coords.map((_, i) => [i]);

  let res = 0;
  while (distances.length) {
    const [d, i1, i2] = distances.shift()!;

    const j1 = circuits.findIndex((c) => c.some((i) => i === i1));
    const cc1 = circuits[j1];
    const j2 = circuits.findIndex((c) => c.some((i) => i === i2));
    const cc2 = circuits[j2];

    if (cc1 === cc2) {
    } else {
      circuits.splice(j2, 1);
      cc1?.push(...cc2!);
    }
    logIfTesting(
      `join ${i1} + ${i2} -> ${circuits.filter((c) => c.length > 1).map((c) => `[${c.join(", ")}]`)}`,
    );
    if (circuits.length === 1) {
      res = coords[i1]!.x * coords[i2]!.x;
      break;
    }
  }

  return res;
}

if (Bun.env.NODE_ENV === "test") {
  test("example", async () => {
    const example = await readExample();
    expect(partOne(example, 10)).toBe(40);
  });
  test("pt. 2 example", async () => {
    const example = await readExample();
    expect(partTwo(example)).toBe(25272);
  });
} else {
  const input = await readInput();
  console.log(partOne(input, 1000));
  console.log(partTwo(input));
}
