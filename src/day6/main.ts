import { expect, test } from "bun:test";
import { logIfTesting } from "@/utils/testing.js";
import { readExample, readInput } from "@/utils/file-io.js";
import { invertMatrix } from "@/utils/matrix.js";

function partOne(s: string): number {
	let matrix = s.split('\n').map(line => line.trim().split(/\s+/g))
	let operations = invertMatrix(matrix)

	let res = 0;
	operations.forEach((line: string[]) => {
		const op = line.at(-1)
		res += line
			.slice(0, line.length - 1)
			.reduce((acc: number, curr: string) => {
				if (op === '*') return acc * Number(curr)
				else if (op === '+') return acc + Number(curr)
				return acc
			}, op === '*' ? 1 : 0)
	})
	return res;
}

function partTwo(s: string): number {
	let lines = s.split('\n')
	let op_idxs = lines.at(-1)!.split('').reduce((acc, curr, i) => {
		if (curr === ' ') return acc
		return [...acc, i]
	}, [] as number[])

	let res = 0;
	op_idxs.forEach((i, idx) => {
		logIfTesting('i:', i)
		let op = lines.at(-1)![i]
		let end = op_idxs[idx + 1] ? op_idxs[idx + 1]! - 1 : lines.at(0)!.length
		logIfTesting('end:', end)
		let acc = op === '*' ? 1 : 0;

		for (let col = i; col < end; col++) {
			let num_str = ''
			for (let row = 0; row < lines.length - 1; row++) {
				num_str += lines[row]![col]
			}
			const num = Number(num_str)
			logIfTesting(num_str)
			acc = op === '*' ? acc * num : acc + num
		}
		logIfTesting(op)
		logIfTesting(`TOTAL: ${acc}\n`)
		res += acc
	})

	return res;
}

if (Bun.env.NODE_ENV === "test") {
	test("example", async () => {
		const example = await readExample();
		expect(partOne(example)).toBe(4277556);
	});
	test("pt. 2 example", async () => {
		const example = await readExample();
		expect(partTwo(example)).toBe(3263827);
	});
} else {
	const input = await readInput();
	console.log(partOne(input));
	console.log(partTwo(input));
}
