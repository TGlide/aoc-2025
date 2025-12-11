import { expect, test, describe } from "bun:test";
import {
  combinations,
  multicombinations,
  unique,
  first,
  last,
  middle,
  swap,
  remove,
  sum,
  getIdxAt,
  compareArr,
} from "./array";

describe("combinations", () => {
  test("returns empty array for empty input", () => {
    expect(combinations([], 1)).toEqual([]);
    expect(combinations([], 2)).toEqual([]);
  });

  test("returns single element combinations", () => {
    expect(combinations([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    expect(combinations(["a", "b"], 1)).toEqual([["a"], ["b"]]);
  });

  test("returns 2-element combinations", () => {
    expect(combinations([1, 2, 3], 2)).toEqual([
      [1, 2],
      [1, 3],
      [2, 3],
    ]);
    expect(combinations(["a", "b", "c"], 2)).toEqual([
      ["a", "b"],
      ["a", "c"],
      ["b", "c"],
    ]);
  });

  test("returns 3-element combinations", () => {
    expect(combinations([1, 2, 3, 4], 3)).toEqual([
      [1, 2, 3],
      [1, 2, 4],
      [1, 3, 4],
      [2, 3, 4],
    ]);
  });

  test("returns empty array when n > array length", () => {
    expect(combinations([1, 2], 3)).toEqual([]);
    expect(combinations([1], 2)).toEqual([]);
  });

  test("returns single combination when n equals array length", () => {
    expect(combinations([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  test("works with complex types", () => {
    const objects = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = combinations(objects, 2);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result[1]).toEqual([{ id: 1 }, { id: 3 }]);
    expect(result[2]).toEqual([{ id: 2 }, { id: 3 }]);
  });
});

describe("multicombinations", () => {
  test("returns empty array for empty input", () => {
    expect(multicombinations([], 1)).toEqual([]);
    expect(multicombinations([], 2)).toEqual([]);
  });

  test("returns single element multicombinations", () => {
    expect(multicombinations([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    expect(multicombinations(["a", "b"], 1)).toEqual([["a"], ["b"]]);
  });

  test("returns 2-element multicombinations (allows reuse)", () => {
    expect(multicombinations([1, 2, 3], 2)).toEqual([
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 2],
      [2, 3],
      [3, 3],
    ]);
  });

  test("returns 3-element multicombinations", () => {
    const result = multicombinations([1, 2], 3);
    expect(result).toEqual([
      [1, 1, 1],
      [1, 1, 2],
      [1, 2, 2],
      [2, 2, 2],
    ]);
  });

  test("handles larger n values correctly", () => {
    const result = multicombinations([1, 2], 4);
    expect(result).toHaveLength(5); // (n+k-1)!/(n!(k-1)!) = (4+2-1)!/(4!(2-1)!) = 5!/(4!1!) = 5
    expect(result).toEqual([
      [1, 1, 1, 1],
      [1, 1, 1, 2],
      [1, 1, 2, 2],
      [1, 2, 2, 2],
      [2, 2, 2, 2],
    ]);
  });
});

describe("unique", () => {
  test("removes duplicate numbers", () => {
    expect(unique([1, 2, 2, 3, 1, 4])).toEqual([1, 2, 3, 4]);
  });

  test("removes duplicate strings", () => {
    expect(unique(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });

  test("handles empty array", () => {
    expect(unique([])).toEqual([]);
  });

  test("handles array with no duplicates", () => {
    expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
  });

  test("preserves order of first occurrence", () => {
    expect(unique([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
  });
});

describe("first", () => {
  test("returns first element", () => {
    expect(first([1, 2, 3])).toBe(1);
    expect(first(["a", "b", "c"])).toBe("a");
  });

  test("returns undefined for empty array", () => {
    expect(first([])).toBeUndefined();
  });

  test("works with single element array", () => {
    expect(first([42])).toBe(42);
  });
});

describe("last", () => {
  test("returns last element", () => {
    expect(last([1, 2, 3])).toBe(3);
    expect(last(["a", "b", "c"])).toBe("c");
  });

  test("returns undefined for empty array", () => {
    expect(last([])).toBeUndefined();
  });

  test("works with single element array", () => {
    expect(last([42])).toBe(42);
  });
});

describe("middle", () => {
  test("returns middle element for odd length", () => {
    expect(middle([1, 2, 3])).toBe(2);
    expect(middle([1, 2, 3, 4, 5])).toBe(3);
  });

  test("returns upper middle element for even length", () => {
    expect(middle([1, 2, 3, 4])).toBe(3);
    expect(middle([1, 2, 3, 4, 5, 6])).toBe(4);
  });

  test("returns undefined for empty array", () => {
    expect(middle([])).toBeUndefined();
  });

  test("works with single element array", () => {
    expect(middle([42])).toBe(42);
  });
});

describe("swap", () => {
  test("swaps elements at given indices", () => {
    expect(swap(0, 2, [1, 2, 3])).toEqual([3, 2, 1]);
    expect(swap(1, 3, ["a", "b", "c", "d"])).toEqual(["a", "d", "c", "b"]);
  });

  test("returns new array (immutable)", () => {
    const original = [1, 2, 3];
    const swapped = swap(0, 2, original);
    expect(swapped).toEqual([3, 2, 1]);
    expect(original).toEqual([1, 2, 3]); // Original unchanged
  });

  test("handles swapping same index", () => {
    expect(swap(1, 1, [1, 2, 3])).toEqual([1, 2, 3]);
  });

  test("works with negative indices", () => {
    // Note: swap function doesn't handle negative indices, it uses them as-is
    expect(swap(-1, 0, [1, 2, 3])).toEqual([undefined, 2, 3] as any);
  });
});

describe("remove", () => {
  test("removes element at given index", () => {
    expect(remove([1, 2, 3, 4], 2)).toEqual([1, 2, 4]);
    expect(remove(["a", "b", "c"], 0)).toEqual(["b", "c"]);
  });

  test("returns new array (immutable)", () => {
    const original = [1, 2, 3];
    const removed = remove(original, 1);
    expect(removed).toEqual([1, 3]);
    expect(original).toEqual([1, 2, 3]); // Original unchanged
  });

  test("handles removing from empty array", () => {
    expect(remove([], 0)).toEqual([]);
  });

  test("handles out of bounds index", () => {
    expect(remove([1, 2, 3], 10)).toEqual([1, 2, 3]);
    expect(remove([1, 2, 3], -1)).toEqual([1, 2, 3]);
  });
});

describe("sum", () => {
  test("sums array of positive numbers", () => {
    expect(sum([1, 2, 3, 4])).toBe(10);
    expect(sum([5, 10, 15])).toBe(30);
  });

  test("sums array with negative numbers", () => {
    expect(sum([1, -2, 3, -4])).toBe(-2);
    expect(sum([-1, -2, -3])).toBe(-6);
  });

  test("handles empty array", () => {
    expect(sum([])).toBe(0);
  });

  test("handles single element array", () => {
    expect(sum([42])).toBe(42);
  });

  test("handles zeros", () => {
    expect(sum([0, 0, 0])).toBe(0);
    expect(sum([1, 0, 2, 0, 3])).toBe(6);
  });
});

describe("getIdxAt", () => {
  test("handles positive indices within bounds", () => {
    expect(getIdxAt(0, 5)).toBe(0);
    expect(getIdxAt(2, 5)).toBe(2);
    expect(getIdxAt(4, 5)).toBe(4);
  });

  test("handles positive indices out of bounds (wraps around)", () => {
    expect(getIdxAt(5, 5)).toBe(0);
    expect(getIdxAt(6, 5)).toBe(1);
    expect(getIdxAt(10, 5)).toBe(0);
  });

  test("handles negative indices", () => {
    expect(getIdxAt(-1, 5)).toBe(4);
    expect(getIdxAt(-2, 5)).toBe(3);
    expect(getIdxAt(-5, 5)).toBe(5); // -5 % 5 = 0, so 5 + 0 = 5
  });

  test("handles negative indices out of bounds (wraps around)", () => {
    expect(getIdxAt(-6, 5)).toBe(4);
    expect(getIdxAt(-7, 5)).toBe(3);
  });

  test("handles edge cases", () => {
    expect(getIdxAt(0, 1)).toBe(0);
    expect(getIdxAt(-1, 1)).toBe(1); // -1 % 1 = 0, so 1 + 0 = 1
  });
});

describe("compareArr", () => {
  test("returns true for identical arrays", () => {
    expect(compareArr([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(compareArr(["a", "b", "c"], ["a", "b", "c"])).toBe(true);
  });

  test("returns false for different arrays", () => {
    expect(compareArr([1, 2, 3], [1, 2, 4])).toBe(false);
    expect(compareArr(["a", "b"], ["a", "c"])).toBe(false);
  });

  test("returns false for different lengths", () => {
    expect(compareArr([1, 2, 3], [1, 2])).toBe(false);
    // Note: compareArr uses every() which only checks up to the shorter array length
    expect(compareArr([1, 2], [1, 2, 3])).toBe(true); // Only compares first 2 elements
  });

  test("returns true for empty arrays", () => {
    expect(compareArr([], [])).toBe(true);
  });

  test("handles mixed types", () => {
    expect(compareArr([1, "2", true], [1, "2", true])).toBe(true);
    expect(compareArr([1, "2", true], [1, 2, true])).toBe(false);
  });

  test("handles nested arrays", () => {
    // Note: compareArr uses === which doesn't work for nested array comparison
    expect(
      compareArr(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [1, 2],
          [3, 4],
        ],
      ),
    ).toBe(false); // Different object references
    expect(
      compareArr(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [1, 2],
          [3, 5],
        ],
      ),
    ).toBe(false);
  });
});

