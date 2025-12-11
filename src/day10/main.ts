import { expect, test } from "bun:test";
import { readExample, readInput } from "@/utils/file-io.js";
import { regex } from "arkregex";
import { compareArr, multicombinations } from "@/utils/array";
import { logIfTesting } from "@/utils/testing";
import { ProgressBar } from "@/utils/progress-bar";

type Machine = {
  diagram: Diagram;
  wirings: Wiring[];
  joltage: Joltage;
};

type Diagram = Array<boolean>;

type Wiring = number[];

type Joltage = number[];

function partOne(s: string): number {
  const pattern = regex(
    "^\\[(?<diagram>[.#]*?)\\](?<wiring>.*?){(?<joltage>.*?)}$",
  );
  const machines: Machine[] = s.split("\n").map((line) => {
    const parts = pattern.exec(line);
    if (!parts?.groups) throw new Error("Parsing error");
    return {
      diagram: parts.groups.diagram.split("").map((c) => c === "#"),
      wirings: parts.groups.wiring
        .trim()
        .split(" ")
        .map((w) => {
          return w
            .slice(1, w.length - 1)
            .split(",")
            .map(Number);
        }),
      joltage: parts.groups.joltage.split(",").map(Number),
    };
  });

  logIfTesting(machines);

  let res = 0;
  machines.forEach((m) => {
    let n = 0;
    let d = m.diagram.map((_) => false);
    while (!compareArr(d, m.diagram)) {
      n++;
      const combinations = multicombinations(m.wirings, n);
      for (const combo of combinations) {
        d = m.diagram.map((_) => false);
        for (const wiring of combo) {
          wiring.forEach((i) => (d[i] = !d[i]));
        }
        if (compareArr(d, m.diagram)) break;
      }
    }
    res += n;
  });

  return res;
}

function partTwo(s: string): number {
  const pattern = regex(
    "^\\[(?<diagram>[.#]*?)\\](?<wiring>.*?){(?<joltage>.*?)}$",
  );
  const machines: Machine[] = s.split("\n").map((line) => {
    const parts = pattern.exec(line);
    if (!parts?.groups) throw new Error("Parsing error");
    return {
      diagram: parts.groups.diagram.split("").map((c) => c === "#"),
      wirings: parts.groups.wiring
        .trim()
        .split(" ")
        .map((w) => {
          return w
            .slice(1, w.length - 1)
            .split(",")
            .map(Number);
        }),
      joltage: parts.groups.joltage.split(",").map(Number),
    };
  });

  logIfTesting(machines);

  let res = 0;
  const progress = new ProgressBar({
    total: machines.length,
  });
  machines.forEach((m, i) => {
    progress.update(i + 1);
    let n = 0;
    let j = m.joltage.map((_) => 0);
    while (!compareArr(j, m.joltage)) {
      n++;
      const combinations = multicombinations(m.wirings, n);
      for (const combo of combinations) {
        j = m.joltage.map((_) => 0);
        for (const wiring of combo) {
          wiring.forEach((i) => j[i]++);
        }
        if (compareArr(j, m.joltage)) break;
      }
    }
    res += n;
  });

  return res;
}

if (Bun.env.NODE_ENV === "test") {
  test("example", async () => {
    const example = await readExample();
    expect(partOne(example)).toBe(7);
  });
  test("pt. 2 example", async () => {
    const example = await readExample();
    expect(partTwo(example)).toBe(33);
  });
} else {
  const input = await readInput();
  console.log(partOne(input));
  console.log(partTwo(input));
}
