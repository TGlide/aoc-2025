import { expect, test } from "bun:test";
import { invertMatrix, logIfTesting, logMatrix, readExample, readInput, TESTING } from "../utils";

function partOne(s: string): number {
	const matrix = s.split('\n').map(l => l.split(''))

	let res = 0
	matrix.slice(0, matrix.length - 1).forEach((line, row) => {
		line.forEach((cell, col) => {
			if (cell !== 'S' && cell !== '|') return
			const nextCell = matrix[row + 1]![col]
			if (nextCell === '.') matrix[row + 1]![col] = '|'
			else if (nextCell === '^') {
				if (col > 0) matrix[row + 1]![col - 1] = '|'
				if (col < line.length - 1) matrix[row + 1]![col + 1] = '|'
				res++
			}

		})
	})
	if (TESTING) logMatrix(matrix)
	return res
}

function isNum(s: string): boolean {
	return !Number.isNaN(Number(s))
}

function partTwo(s: string): number {
	const matrix = s.split('\n').map(l => l.split(''))

	let res = 0;
	matrix.slice(0, matrix.length - 1).forEach((line, row) => {
		line.forEach((cell, col) => {
			if (cell !== 'S' && !isNum(cell)) return
			const nextCell = matrix[row + 1]![col]!
			if (nextCell === '.') matrix[row + 1]![col] = isNum(cell) ? cell : '1'
			else if (nextCell === '^') {
				if (col > 0) {
					const after = matrix[row + 1]![col - 1]!
					if (isNum(after)) {
						matrix[row + 1]![col - 1] = `${Number(after) + Number(cell)}`
					} else {
						matrix[row + 1]![col - 1] = cell
					}
				}
				if (col < line.length - 1) {
					const after = matrix[row + 1]![col + 1]!
					if (isNum(after)) {
						matrix[row + 1]![col + 1] = `${Number(after) + Number(cell)}`
					} else {
						matrix[row + 1]![col + 1] = cell
					}
				}
			}
			else if (isNum(nextCell)) {
				matrix[row + 1]![col] = `${Number(nextCell) + Number(cell)}`


			}

		})

		res = matrix[row + 1]!.reduce((acc, curr) => {
			if (!isNum(curr)) return acc
			return acc + Number(curr)
		}, 0)
		if (TESTING) logMatrix(matrix)
		logIfTesting(res, '\n')
	})
	if (TESTING) logMatrix(matrix)
	return res
}

if (Bun.env.NODE_ENV === "test") {
	test("example", async () => {
		const example = await readExample();
		expect(partOne(example)).toBe(21);
	});
	test("pt. 2 example", async () => {
		const example = await readExample();
		expect(partTwo(example)).toBe(40);
	});
} else {
	const input = await readInput();
	console.log(partOne(input));
	console.log(partTwo(input));
}
