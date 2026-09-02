
export const countingSort = (arr: number[], max: number): number[] => {
    // Crea una posizione per contare ogni possibile valore compreso tra 0 e max.
    const count = new Array(max + 1).fill(0);

    // Prepara un nuovo array che conterrà il risultato ordinato.
    const output = new Array(arr.length);

    // Conta quante volte compare ciascun valore nell'array originale.
    for (let i = 0; i < arr.length; i++) {
        count[arr[i]]++;
    }

    // Trasforma le frequenze in somme cumulative: count[i] indica quanti
    // elementi sono minori o uguali a i.
    for (let i = 1; i <= max; i++) {
        count[i] += count[i - 1];
    }

    // Scorre da destra verso sinistra per mantenere stabile l'ordinamento.
    for (let i = arr.length - 1; i >= 0; i--) {
        // La somma cumulativa determina l'ultima posizione libera del valore.
        output[count[arr[i]] - 1] = arr[i];

        // Decrementa il conteggio per la prossima occorrenza dello stesso valore.
        count[arr[i]]--;
    }

    // Restituisce il nuovo array ordinato senza modificare quello originale.
    return output;
};
