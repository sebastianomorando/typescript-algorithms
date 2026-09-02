# TypeScript Algorithms

A collection of algorithms implemented in TypeScript and run with Bun.

Each algorithm in this repository is accompanied by:

- Unit tests that verify its correctness and cover common edge cases.
- Benchmarks that measure its execution time and make performance comparisons easier.

## Visualizations and explanations

Interactive animations and detailed explanations of each algorithm are available at [mastorna.it/sorting-algorithms](https://mastorna.it/sorting-algorithms).

## Setup

Install the dependencies:

```bash
bun install
```

## Tests

Run all unit tests:

```bash
bun test
```

## Benchmarks

Run the sorting algorithm benchmarks:

```bash
bun run bench:sort
```

You can change the number of randomly generated values with the `BENCH_ARRAY_SIZE` environment variable:

```bash
BENCH_ARRAY_SIZE=100000 bun run bench:sort
```
