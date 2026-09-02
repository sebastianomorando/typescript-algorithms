
const merge = (arr: number[], left: number, mid: number, right: number): void => {
    // Copia le due metà già ordinate in due array temporanei.
    let L = arr.slice(left, mid + 1);
    let R = arr.slice(mid + 1, right + 1);

    // i e j indicano il prossimo elemento da leggere nelle due metà.
    let i = 0;
    let j = 0;

    // B raccoglie gli elementi delle due metà nel nuovo ordine.
    let B = [];

    // Confronta i primi elementi non ancora usati delle due metà.
    while (i < L.length && j < R.length) {
        if (L[i] <= R[j]) {
            // Il valore a sinistra è il più piccolo: lo aggiunge e avanza in L.
            B.push(L[i]);
            i++;
        } else {
            // Il valore a destra è il più piccolo: lo aggiunge e avanza in R.
            B.push(R[j]);
            j++;
        }
    }

    // Se L contiene ancora elementi, sono già ordinati e vengono aggiunti in coda.
    while (i < L.length) {
        B.push(L[i]);
        i++;
    }

    // Fa lo stesso con gli eventuali elementi rimasti in R.
    while (j < R.length) {
        B.push(R[j]);
        j++;
    }

    // Copia la sequenza unita nella posizione originale dell'array.
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
    // Un intervallo vuoto o con un solo elemento è già ordinato.
    if (left >= right) {
        return arr;
    }

    // Divide l'intervallo corrente in due metà.
    const mid = Math.floor((left + right) / 2);

    // Ordina ricorsivamente prima la metà sinistra e poi quella destra.
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);

    // Unisce le due metà ordinate in un unico intervallo ordinato.
    merge(arr, left, mid, right);

    // Restituisce l'array originale dopo aver ordinato l'intervallo richiesto.
    return arr;
};
