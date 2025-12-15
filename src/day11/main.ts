import { expect, test } from "bun:test";
import { readExample, readInput, readTxt } from "@/utils/file-io.js";
import { logIfTesting } from "@/utils/testing";
import { memoize } from "@/utils/memo";

const SEP = ">";

function partOne(s: string): number {
  const devices = s.split("\n").reduce(
    (acc, line) => {
      const [name, attached] = line.split(":");
      return { ...acc, [name]: attached.trim().split(" ") };
    },
    {} as Record<string, string[]>,
  );

  const findPathsToOut = memoize((node: string): string[] => {
    if (node === "out") return [node];
    const outputs = devices[node];
    return outputs.reduce((acc, o) => {
      const res = findPathsToOut(o);
      res.forEach((r) => acc.push(node + SEP + r));
      return acc;
    }, [] as string[]);
  });
  const paths = findPathsToOut("you");

  return paths.length;
}

function partTwo(s: string): number {
  const devices = s.split("\n").reduce(
    (acc, line) => {
      const [name, attached] = line.split(":");
      return { ...acc, [name]: attached.trim().split(" ") };
    },
    {} as Record<string, string[]>,
  );

  const findPathsToOut = memoize((node: string): string[] => {
    if (node === "out") return [node];
    const outputs = devices[node];
    return outputs.reduce((acc, o) => {
      const res = findPathsToOut(o);
      res.forEach((r) => acc.push(node + SEP + r));
      return acc;
    }, [] as string[]);
  });
  const paths = findPathsToOut("svr").filter(
    (p) => p.includes("dac") && p.includes("fft"),
  );

  return paths.length;
}

if (Bun.env.NODE_ENV === "test") {
  test("example", async () => {
    const example = await readExample();
    expect(partOne(example)).toBe(5);
  });
  test("pt. 2 example", async () => {
    const example = await readTxt("example-2");
    expect(partTwo(example)).toBe(2);
  });
} else {
  const input = await readInput();
  console.log(partOne(input));
  console.log(partTwo(input));
}
