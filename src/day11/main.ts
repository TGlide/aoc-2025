import { expect, test } from "bun:test";
import { readExample, readInput, readTxt } from "@/utils/file-io.js";
import { logIfTesting } from "@/utils/testing";
import { memoize } from "@/utils/memo";

function partOne(s: string): number {
  const devices = s.split("\n").reduce(
    (acc, line) => {
      const [name, attached] = line.split(":");
      return { ...acc, [name]: attached.trim().split(" ") };
    },
    {} as Record<string, string[]>,
  );

  const findPathsToOut = memoize((node: string): number => {
    if (node === "out") return 1;
    const outputs = devices[node];

    return outputs.reduce((acc, o) => {
      return acc + findPathsToOut(o);
    }, 0);
  });
  return findPathsToOut("you");
}

function partTwo(s: string): number {
  const devices = s.split("\n").reduce(
    (acc, line) => {
      const [name, attached] = line.split(":");
      return { ...acc, [name]: attached.trim().split(" ") };
    },
    {} as Record<string, string[]>,
  );

  const findPathsToOut = memoize(
    (node: string, found: { dac: boolean; fft: boolean }): number => {
      if (node === "out") return found.dac && found.fft ? 1 : 0;
      const outputs = devices[node];

      return outputs.reduce((acc, o) => {
        return (
          acc +
          findPathsToOut(o, {
            dac: found.dac || node === "dac",
            fft: found.fft || node === "fft",
          })
        );
      }, 0);
    },
  );
  return findPathsToOut("svr", { dac: false, fft: false });
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
