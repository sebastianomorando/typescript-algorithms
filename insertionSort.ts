/**
 * order in place
 * stable
 * complexity: O(n^2)
 * 
 * @param arr - array of numbers to be sorted
 */
export const insertionSort = (arr: number[]) => {
    // La porzione a sinistra di j è già ordinata; si parte dal secondo elemento.
    for (let j = 1; j < arr.length; j++) {
        // Salva il valore da inserire nella posizione corretta della parte ordinata.
        let key = arr[j];

        // Inizia il confronto dall'elemento immediatamente precedente a key.
        let i = j - 1;

        // Sposta di una posizione a destra tutti i valori maggiori di key.
        while (i >= 0 && arr[i] > key) {
            arr[i + 1] = arr[i];

            // Continua a cercare verso sinistra la posizione di inserimento.
            i--;
        }

        // Inserisce key nello spazio lasciato libero dagli spostamenti.
        arr[i + 1] = key;
    }

    // L'algoritmo modifica e restituisce lo stesso array ricevuto.
    return arr;
};
