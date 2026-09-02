/**
 * order in place
 * stable
 * complexity: O(n^2)
 * 
 * @param arr - array of numbers to be sorted
 */
export const insertionSort = (arr: number[]) => {
    for (let j = 1; j < arr.length; j++) {
        let key = arr[j];
        let i = j - 1;
        while (i >= 0 && arr[i] > key) {
            arr[i + 1] = arr[i];
            i--;
        }
        arr[i + 1] = key;
    }
    return arr;
};