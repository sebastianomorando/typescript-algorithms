import { countingSort } from "./countingSort";

const ARRAY_SIZE = 10_000;
const MAX_VALUE = 30;
const SAMPLE_COUNT = 100;

type Sorter = {
    name: string;
    sort: (values: number[]) => number[];
};

const sorters: Sorter[] = [
    {
        name: "countingSort",
        sort: (values) => countingSort(values, MAX_VALUE),
    },
    {
        name: "JavaScript Array.sort",
        sort: (values) => values.sort((a, b) => a - b),
    },
];

const createRandomArray = () => Array.from(
    { length: ARRAY_SIZE },
    () => Math.floor(Math.random() * (MAX_VALUE + 1)),
);

const isSorted = (arr: number[]) => arr.every(
    (value, index) => index === 0 || arr[index - 1]! <= value,
);

const measure = ({ sort }: Sorter, values: number[]) => {
    // Copying the input is excluded from the measured time.
    const valuesToSort = [...values];
    const start = Bun.nanoseconds();
    const result = sort(valuesToSort);
    const elapsedNanoseconds = Bun.nanoseconds() - start;

    return {
        elapsedNanoseconds,
        sortedCorrectly: isSorted(result),
    };
};

console.log(
    `Generating ${ARRAY_SIZE.toLocaleString()} random integers between 0 and ${MAX_VALUE}...`,
);
const values = createRandomArray();

console.log(
    `Generating ${SAMPLE_COUNT} arrays of ${ARRAY_SIZE.toLocaleString()} random integers...`,
);
const samples = Array.from({ length: SAMPLE_COUNT }, createRandomArray);

const results = sorters.map((sorter) => {
    const singleResult = measure(sorter, values);
    let totalNanoseconds = 0;
    let allSortedCorrectly = singleResult.sortedCorrectly;

    for (const sample of samples) {
        const sampleResult = measure(sorter, sample);
        totalNanoseconds += sampleResult.elapsedNanoseconds;
        allSortedCorrectly &&= sampleResult.sortedCorrectly;
    }

    return {
        Algorithm: sorter.name,
        "Single array time (ms)": Number(
            (singleResult.elapsedNanoseconds / 1_000_000).toFixed(3),
        ),
        "Average time (ms)": Number(
            (totalNanoseconds / SAMPLE_COUNT / 1_000_000).toFixed(3),
        ),
        "Sorted correctly": allSortedCorrectly,
    };
});

console.table(results);
