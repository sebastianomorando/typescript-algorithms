
export const quickSort = (arr: number[], low: number, high: number) => {
    if (low >= high) {
        return;
    }

    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    const pivotIndex = i + 1;

    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
};

export const randomizedQuickSort = (arr: number[], low: number, high: number) => {
    if (low >= high) {
        return;
    }

    const randomIndex = Math.floor(Math.random() * (high - low + 1)) + low;
    [arr[randomIndex], arr[high]] = [arr[high], arr[randomIndex]];

    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    const pivotIndex = i + 1;

    randomizedQuickSort(arr, low, pivotIndex - 1);
    randomizedQuickSort(arr, pivotIndex + 1, high);
};