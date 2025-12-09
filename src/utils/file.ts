import fs from "fs";

export function readFile(path: string): string {
  return fs.readFileSync(path, "utf8").trim();
}

export function getCurrentDay() {
  const stack = new Error().stack;
  if (!stack) return null;

  const match = stack.match(/days\/(\d+)\/\d+\.ts/);
  return match ? parseInt(match[1]) : null;
}

export interface DayInputs {
  input: string;
  example: string;
  [key: `example${number}`]: string;
}

export function readCurrentDayInputs(): DayInputs {
  const day = getCurrentDay();
  if (!day) throw new Error("Could not determine current day from file path");

  const input = readFile(`days/${day}/${day}.txt`);
  const example = readFile(`days/${day}/${day}-example.txt`);

  // Try to read additional example files if they exist
  const additionalExamples: Record<`example${number}`, string> = {};
  let i = 2;
  while (true) {
    try {
      const path = `days/${day}/${day}-example-${i}.txt`;
      if (!fs.existsSync(path)) break;
      additionalExamples[`example${i}`] = readFile(path);
      i++;
    } catch {
      break;
    }
  }

  return { input, example, ...additionalExamples };
}

export function readDayInputs(day: number) {
  const input = readFile(`days/${day}/${day}.txt`);
  const example = readFile(`days/${day}/${day}-example.txt`);

  return { input, example };
}
