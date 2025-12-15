function getCallerDir(): string {
  const err = new Error();
  const stack = err.stack!.split("\n");
  // Find the first stack frame that's not in file-io.ts
  for (const line of stack) {
    const match =
      line.match(/at .+ \((.+):\d+:\d+\)/) || line.match(/at (.+):\d+:\d+/);
    if (match?.[1] && !match[1].includes("file-io.ts")) {
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

export async function readTxt(name: string): Promise<string> {
  const dir = getCallerDir();
  return (await Bun.file(`${dir}/${name}.txt`).text()).trim();
}
