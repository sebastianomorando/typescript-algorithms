import { describe, expect, test } from "bun:test";
import { insertionSort } from "./insertionSort";
import { mergeSort } from "./mergeSort";

describe("insertionSort", () => {
    test("should sort an array of numbers in ascending order", () => {
        const arr = [5, 2, 9, 1, 5, 6];
        const sortedArr = insertionSort(arr);
        expect(sortedArr).toEqual([1, 2, 5, 5, 6, 9]);
    });

    test("should handle an empty array", () => {
        const arr: number[] = [];
        const sortedArr = insertionSort(arr);
        expect(sortedArr).toEqual([]);
    });

    test("should handle an array with one element", () => {
        const arr = [42];
        const sortedArr = insertionSort(arr);
        expect(sortedArr).toEqual([42]);
    });

    test("should handle an already sorted array", () => {
        const arr = [1, 2, 3, 4, 5];
        const sortedArr = insertionSort(arr);
        expect(sortedArr).toEqual([1, 2, 3, 4, 5]);
    });

    test("should handle an array with negative numbers", () => {
        const arr = [3, -1, 2, -5, 0];
        const sortedArr = insertionSort(arr);
        expect(sortedArr).toEqual([-5, -1, 0, 2, 3]);
    });

    test("should handle an array with duplicate numbers", () => {
        const arr = [4, 2, 4, 3, 2];
        const sortedArr = insertionSort(arr);
        expect(sortedArr).toEqual([2, 2, 3, 4, 4]);
    });
});

describe("mergeSort", () => {
    test("should sort an array of numbers in ascending order", () => {
        const arr = [5, 2, 9, 1, 5, 6];
        const sortedArr = mergeSort(arr, 0, arr.length - 1);
        expect(sortedArr).toEqual([1, 2, 5, 5, 6, 9]);
    });

    test("should handle an empty array", () => {
        const arr: number[] = [];
        const sortedArr = mergeSort(arr, 0, arr.length - 1);
        expect(sortedArr).toEqual([]);
    });

    test("should handle an array with one element", () => {
        const arr = [42];
        const sortedArr = mergeSort(arr, 0, arr.length - 1);
        expect(sortedArr).toEqual([42]);
    });

    test("should handle an already sorted array", () => {
        const arr = [1, 2, 3, 4, 5];
        const sortedArr = mergeSort(arr, 0, arr.length - 1);
        expect(sortedArr).toEqual([1, 2, 3, 4, 5]);
    });

    test("should handle an array with negative numbers", () => {
        const arr = [3, -1, 2, -5, 0];
        const sortedArr = mergeSort(arr, 0, arr.length - 1);
        expect(sortedArr).toEqual([-5, -1, 0, 2, 3]);
    });

    test("should handle an array with duplicate numbers", () => {
        const arr = [4, 2, 4, 3, 2];
        const sortedArr = mergeSort(arr, 0, arr.length - 1);
        expect(sortedArr).toEqual([2, 2, 3, 4, 4]);
    });
});