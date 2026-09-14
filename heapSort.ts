let _heapLength: number;

/**
 * Returns the current heap size used by the sift-down process.
 * A shared module-level variable is used to avoid passing the limit
 * recursively at every call.
 */
const heapLength = (A: number[]) => _heapLength;

/**
 * Computes the left child index in a zero-based binary heap.
 */
const leftChild = (i: number) => 2 * i + 1;

/**
 * Computes the right child index in a zero-based binary heap.
 */
const rightChild = (i: number) => 2 * i + 2;

/**
 * Computes the parent index in a zero-based binary heap.
 */
const parent = (i: number) => Math.floor((i - 1) / 2);

/**
 * Restores the max-heap property for the subtree rooted at `i`.
 * The largest value among node and children is moved up, then the heap is
 * fixed recursively on the affected child.
 */
const heapify = (A: number[], i: number) => {
    const leftIndex = leftChild(i);
    const rightIndex = rightChild(i);
    let largest = i;

    if (leftIndex < _heapLength && A[leftIndex] > A[largest]) {
        largest = leftIndex;
    }

    if (rightIndex < _heapLength && A[rightIndex] > A[largest]) {
        largest = rightIndex;
    }

    if (largest !== i) {
        [A[i], A[largest]] = [A[largest], A[i]];
        heapify(A, largest);
    }
};

/**
 * Builds a max-heap in-place from the input array by heapifying internal nodes.
 */
const buildMaxHeap = (A: number[]) => {
    _heapLength = A.length;
    for (let i = Math.floor(_heapLength / 2) - 1; i >= 0; i--) {
        heapify(A, i);
    }
};

/**
 * Sorts an array in ascending order using Heap Sort.
 * The array is sorted in-place by repeatedly moving the current max to the end
 * and restoring the heap on the remaining prefix.
 */
export const heapSort = (A: number[]) => {
    // `heapLength` keeps track of the currently-unsorted prefix during sorting.
    void heapLength(A);
    buildMaxHeap(A);
    for (let i = A.length - 1; i > 0; i--) {
        [A[0], A[i]] = [A[i], A[0]];
        _heapLength--;
        heapify(A, 0);
    }
};
