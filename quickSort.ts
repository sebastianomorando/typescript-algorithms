
export const quickSort = (arr: number[], low: number, high: number) => {
    // Un intervallo vuoto o con un solo elemento non richiede ordinamento.
    if (low >= high) {
        return;
    }

    // Usa l'ultimo elemento dell'intervallo come pivot.
    const pivot = arr[high];

    // i delimita la zona che contiene valori minori o uguali al pivot.
    let i = low - 1;

    // Visita tutti gli elementi dell'intervallo, escluso il pivot.
    for (let j = low; j < high; j++) {
        // Se il valore appartiene alla zona sinistra, amplia la zona e lo sposta lì.
        if (arr[j] <= pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // Posiziona il pivot subito dopo tutti i valori minori o uguali.
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    const pivotIndex = i + 1;

    // Ordina ricorsivamente le porzioni ai due lati del pivot.
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
};

export const randomizedQuickSort = (arr: number[], low: number, high: number) => {
    // Un intervallo vuoto o con un solo elemento non richiede ordinamento.
    if (low >= high) {
        return;
    }

    // Sceglie casualmente il pivot tra gli elementi dell'intervallo corrente.
    const randomIndex = Math.floor(Math.random() * (high - low + 1)) + low;

    // Porta il pivot scelto in fondo per applicare la stessa partizione di quicksort.
    [arr[randomIndex], arr[high]] = [arr[high], arr[randomIndex]];

    // Da questo punto l'ultimo elemento è il pivot casuale appena selezionato.
    const pivot = arr[high];

    // i delimita la zona che contiene valori minori o uguali al pivot.
    let i = low - 1;

    // Separa i valori minori o uguali al pivot da quelli maggiori.
    for (let j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // Sposta il pivot nella sua posizione definitiva.
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    const pivotIndex = i + 1;

    // Ripete ricorsivamente il procedimento sulle due partizioni.
    randomizedQuickSort(arr, low, pivotIndex - 1);
    randomizedQuickSort(arr, pivotIndex + 1, high);
};
