import { insertionSort } from "./insertionSort";
import { mergeSort } from "./mergeSort";
import { quickSort, randomizedQuickSort } from "./quickSort";

const DEFAULT_ARRAY_SIZE = 10_000;
const AVERAGE_SAMPLE_COUNT = 100;
const AVERAGE_ARRAY_SIZE = 10_000;
const arraySize = Number.parseInt(
    Bun.env.BENCH_ARRAY_SIZE ?? String(DEFAULT_ARRAY_SIZE),
    10,
);

if (!Number.isSafeInteger(arraySize) || arraySize < 0) {
    throw new Error("BENCH_ARRAY_SIZE must be a non-negative integer");
}

console.log(`Generating ${arraySize.toLocaleString()} random numbers...`);
const values = Array.from({ length: arraySize }, () => Math.random());

type Sorter = {
    name: string;
    sort: (values: number[]) => void;
};

const sorters: Sorter[] = [
    {
        name: "insertionSort",
        sort: (values) => insertionSort(values),
    },
    {
        name: "mergeSort",
        sort: (values) => mergeSort(values, 0, values.length - 1),
    },
    {
        name: "quickSort",
        sort: (values) => quickSort(values, 0, values.length - 1),
    },
    {
        name: "randomizedQuickSort",
        sort: (values) => randomizedQuickSort(values, 0, values.length - 1),
    },
    {
        name: "JavaScript Array.sort",
        sort: (values) => values.sort((a, b) => a - b),
    },
];

const isSorted = (values: number[]) => values.every(
    (value, index) => index === 0 || values[index - 1]! <= value,
);

const benchmark = ({ name, sort }: Sorter) => {
    // Each algorithm receives the same values; copying is not part of the timing.
    const valuesToSort = [...values];

    console.log(`\nSorting with ${name}...`);
    const start = Bun.nanoseconds();
    sort(valuesToSort);
    const elapsedMilliseconds = (Bun.nanoseconds() - start) / 1_000_000;

    console.log(`Elapsed time: ${elapsedMilliseconds.toFixed(2)} ms`);
    console.log(`Sorted correctly: ${isSorted(valuesToSort)}`);

    return elapsedMilliseconds;
};

const singleArrayResults = new Map(
    sorters.map((sorter) => [sorter.name, benchmark(sorter)]),
);

console.log(
    `\nGenerating ${AVERAGE_SAMPLE_COUNT} arrays of ${AVERAGE_ARRAY_SIZE.toLocaleString()} random numbers...`,
);
const samples = Array.from(
    { length: AVERAGE_SAMPLE_COUNT },
    () => Array.from({ length: AVERAGE_ARRAY_SIZE }, () => Math.random()),
);

const averageResults: Array<{
    Algorithm: string;
    "Single array time (ms)": number;
    "Average time (ms)": number;
}> = [];

for (const { name, sort } of sorters) {
    let totalNanoseconds = 0;

    for (const sample of samples) {
        // Copying and correctness checks are excluded from the measured time.
        const valuesToSort = [...sample];
        const start = Bun.nanoseconds();
        sort(valuesToSort);
        totalNanoseconds += Bun.nanoseconds() - start;

        if (!isSorted(valuesToSort)) {
            throw new Error(`${name} did not sort a sample correctly`);
        }
    }

    const averageMilliseconds = totalNanoseconds
        / AVERAGE_SAMPLE_COUNT
        / 1_000_000;
    averageResults.push({
        Algorithm: name,
        "Single array time (ms)": Number(singleArrayResults.get(name)!.toFixed(3)),
        "Average time (ms)": Number(averageMilliseconds.toFixed(3)),
    });
}

console.log("\nAverage sort time:");
console.table(averageResults);
