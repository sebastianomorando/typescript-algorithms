
const merge = (arr: number[], left: number, mid: number, right: number): void => {
    let L = arr.slice(left, mid + 1);
    let R = arr.slice(mid + 1, right + 1);

    let i = 0;
    let j = 0;
    let B = [];

    while (i < L.length && j < R.length) {
        if (L[i] <= R[j]) {
            B.push(L[i]);
            i++;
        } else {
            B.push(R[j]);
            j++;
        }
    }

    while (i < L.length) {
        B.push(L[i]);
        i++;
    }

    while (j < R.length) {
        B.push(R[j]);
        j++;
    }

    for (let k = 0; k < B.length; k++) {
        arr[left + k] = B[k];
    }
};

/**
 * stable
 * not in place
 * complexity: O(n log n)
 * 
 * @param arr - array of numbers to be sorted
 * @param left - starting index
 * @param right - ending index
 * @returns - sorted array
 */
export const mergeSort = (arr: number[], left: number, right: number): number[] => {
    if (left >= right) {
        return arr;
    }

    const mid = Math.floor((left + right) / 2);
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);

    return arr;
};