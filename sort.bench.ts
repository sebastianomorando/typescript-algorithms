import { insertionSort } from "./insertionSort";
import { mergeSort } from "./mergeSort";

const DEFAULT_ARRAY_SIZE = 10_000;
const arraySize = Number.parseInt(
    Bun.env.BENCH_ARRAY_SIZE ?? String(DEFAULT_ARRAY_SIZE),
    10,
);

if (!Number.isSafeInteger(arraySize) || arraySize < 0) {
    throw new Error("BENCH_ARRAY_SIZE must be a non-negative integer");
}

console.log(`Generating ${arraySize.toLocaleString()} random numbers...`);
const values = Array.from({ length: arraySize }, () => Math.random());

const benchmark = (name: string, sort: (values: number[]) => void) => {
    // Each algorithm receives the same values; copying is not part of the timing.
    const valuesToSort = [...values];

    console.log(`\nSorting with ${name}...`);
    const start = Bun.nanoseconds();
    sort(valuesToSort);
    const elapsedMilliseconds = (Bun.nanoseconds() - start) / 1_000_000;

    const isSorted = valuesToSort.every(
        (value, index) => index === 0 || valuesToSort[index - 1]! <= value,
    );

    console.log(`Elapsed time: ${elapsedMilliseconds.toFixed(2)} ms`);
    console.log(`Sorted correctly: ${isSorted}`);
};

benchmark("insertionSort", (values) => {
    insertionSort(values);
});

benchmark("mergeSort", (values) => {
    mergeSort(values, 0, values.length - 1);
});

benchmark("JavaScript Array.sort", (values) => {
    values.sort((a, b) => a - b);
});
