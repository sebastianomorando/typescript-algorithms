import { describe, expect, test } from "bun:test";
import { countingSort } from "./countingSort";

describe("countingSort", () => {
    test("should sort an array of non-negative integers", () => {
        const arr = [4, 2, 2, 8, 3, 3, 1];

        expect(countingSort(arr, 8)).toEqual([1, 2, 2, 3, 3, 4, 8]);
    });

    test("should handle an empty array", () => {
        expect(countingSort([], 0)).toEqual([]);
    });

    test("should handle an array with one element", () => {
        expect(countingSort([5], 5)).toEqual([5]);
    });

    test("should handle an already sorted array", () => {
        expect(countingSort([0, 1, 2, 3, 4], 4)).toEqual([0, 1, 2, 3, 4]);
    });

    test("should handle duplicate values", () => {
        expect(countingSort([3, 1, 3, 0, 1, 3], 3)).toEqual([0, 1, 1, 3, 3, 3]);
    });

    test("should not modify the original array", () => {
        const arr = [3, 1, 2];

        countingSort(arr, 3);

        expect(arr).toEqual([3, 1, 2]);
    });
});
