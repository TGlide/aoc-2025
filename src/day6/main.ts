import { expect, test } from "bun:test";
import { invertMatrix, readExample, readInput } from "../utils";

function partOne(s: string): number {
	let matrix = s.split('\n').map(line => line.trim().split(/\s+/g))
	let operations = invertMatrix(matrix)

	let res = 0;
	operations.forEach(line => {
		const op = line.at(-1)
		res += line
			.slice(0, line.length - 1)
			.reduce((acc, curr) => {
				if (op === '*') return acc * Number(curr)
				else if (op === '+') return acc + Number(curr)
				return acc
			}, op === '*' ? 1 : 0)
	})
	return res;
}

function partTwo(s: string): number {
	let res = 0;
	return res;
}

if (Bun.env.NODE_ENV === "test") {
	test("example", async () => {
		const example = await readExample();
		expect(partOne(example)).toBe(4277556);
	});
	test("pt. 2 example", async () => {
		const example = await readExample();
		expect(partTwo(example)).toBe(0);
	});
} else {
	const input = await readInput();
	console.log(partOne(input));
	console.log(partTwo(input));
}
