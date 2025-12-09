import { expect, test } from "bun:test";
import { logIfTesting, TESTING } from "@/utils/testing.js";
import { readExample, readInput } from "@/utils/file-io.js";
import { simpleLogMatrix } from "@/utils/matrix.js";
import { colors, mark } from "@/utils/colors.js";


function partOne(s: string): number {
	const [rangesPart, ingredientsPart] = s.split("\n\n")
	const ranges = rangesPart!.split("\n").map((line) => {
		const [lb, ub] = line.split("-").map(Number) as [number, number]
		return { lb, ub }
	})
	const ingredients = ingredientsPart!.split("\n").map(Number)

	let res = 0;
	ingredients.forEach(id => {
		for (const { lb, ub } of ranges) {
			if (id >= lb && id <= ub) {
				logIfTesting(id, { lb, ub })
				res++;
				break
			}
		}
	})
	return res
}

type Range = { lb: number; ub: number; }

function joinRanges(r1: Range, r2: Range): Range | null {
	const first = r1.lb <= r2.lb ? r1 : r2
	const second = first === r1 ? r2 : r1
	if (first.ub < second.lb) return null
	return { lb: Math.min(r1.lb, r2.lb), ub: Math.max(r1.ub, r2.ub) }

}

function partTwo(s: string): number {
	const [rangesPart, ingredientsPart] = s.split("\n\n")
	let ranges = rangesPart!.split("\n").map((line) => {
		const [lb, ub] = line.split("-").map(Number) as [number, number]
		return { lb, ub }
	}).sort((a, b) => a.lb - b.lb)
	const oldRanges = [...ranges]

	let res = 0;
	let i = 0;
	while (i < ranges.length - 1) {
		let r1 = ranges[i]!
		let r2 = ranges[i + 1]!
		const nr = joinRanges(r1, r2)
		logIfTesting("Range 1:", r1)
		logIfTesting("Range 2:", r2)
		logIfTesting("New Range:", nr)
		logIfTesting()
		if (!nr) i++;
		else {
			ranges[i] = nr;
			ranges.splice(i + 1, 1)
		}
	}

	return ranges.reduce((acc, curr) => acc + curr.ub - curr.lb + 1, 0)
}

if (Bun.env.NODE_ENV === "test") {
	test("example", async () => {
		const example = await readExample();
		expect(partOne(example)).toBe(3);
	});
	test("pt. 2 example", async () => {
		const example = await readExample();
		expect(partTwo(example)).toBe(14);
	});
} else {
	const input = await readInput();
	console.log(partOne(input));
	console.log(partTwo(input));
}
