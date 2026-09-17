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

## Tree Lab — laboratorio interattivo

Avvia la pagina con Bun (che gestisce anche il bundle di TypeScript, HTML e CSS):

```bash
bun run dev
```

Apri [localhost:3000](http://localhost:3000). Per scegliere un’altra porta usa `PORT=3001 bun run dev`.

- **Aggiungi nodo** crea una radice indipendente; seleziona un nodo e usa **Figlio a sinistra/destra** per aggiungere un figlio collegato.
- Trascina un nodo per spostarlo; **Shift + trascinamento** sposta anche i discendenti. Trascina lo sfondo per muovere la tela, usa la rotellina o i pulsanti per lo zoom e **Centra albero** per inquadrare tutto.
- Il pannello permette di cambiare valore e colore. Per ricollegare un nodo e i suoi discendenti, scegli il **Nodo padre** oppure **Ricollega sulla tela** e poi seleziona il nuovo padre. **Scollega** crea una radice indipendente. I collegamenti che generano cicli sono impediti.
- **Elimina nodo** conserva i figli come radici; **Elimina anche i discendenti** rimuove il sottoalbero. **Annulla/Ripeti** ripristina fino a 100 modifiche nella sessione, incluse eliminazioni, importazioni e spostamenti (`Ctrl/⌘ Z`, `Ctrl/⌘ Shift Z`).
- L’albero viene salvato nel browser. **Esporta/Importa** permette di conservarlo in JSON o trasferirlo; la cronologia non viene salvata. Sono supportati fino a 500 nodi e valori testuali fino a 80 caratteri.
- Doppio clic sullo sfondo per aggiungere un nodo in quel punto, doppio clic sul nodo per editarne il valore. I nodi si possono selezionare anche con Tab e Invio; Canc elimina la selezione, Esc annulla il ricollegamento.

La struttura è libera: può avere più radici e più di due figli per nodo. Sinistra/destra indica la posizione sulla tela, senza imporre vincoli binari. Nessun algoritmo viene eseguito automaticamente: valori, colori e collegamenti sono manuali, anche per esercitarsi con `RBTree.ts`. **Riordina** cambia solo le posizioni, conservando i collegamenti.

Per generare una pagina statica distribuibile:

```bash
bun run build
```

Il bundle viene scritto in `dist/` ed è servibile con un qualsiasi server statico. Non richiede un backend; i font web sono facoltativi, con fallback ai font di sistema.

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
