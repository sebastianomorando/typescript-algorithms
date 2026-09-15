class Node {
    // Il colore del nodo: in un albero rosso-nero i nodi sono sempre rossi o neri.
    color: 'red' | 'black';
    // Valore contenuto nel nodo.
    value: number;
    // Figli sinistro e destro.
    left: Node | null;
    right: Node | null;
    // Puntatore al nodo padre, utile per risalire all'albero durante le rotazioni e la "fix".
    parent: Node | null;

    constructor(value: number, color: 'red' | 'black' = 'red') {
        this.value = value;
        this.color = color;
        this.left = null;
        this.right = null;
        this.parent = null;
    }
}

class RBTree {
    // Radice dell'albero. Deve sempre essere nera.
    root: Node | null;

    constructor() {
        this.root = null;
    }

    // Inserisce un nuovo valore nell'albero.
    // 1) crea il nuovo nodo;
    // 2) lo inserisce nella posizione corretta;
    // 3) riporta le proprietà dell'albero rosso-nero se sono violate.
    insert(value: number): void {
        const newNode = new Node(value);

        if (this.root === null) {
            // Se l'albero è vuoto, il primo nodo diventa la radice e deve essere nero.
            this.root = newNode;
            this.root.color = 'black';
        } else {
            // Inserisce il nodo nella sua posizione ordinata.
            this.insertNode(this.root, newNode);
            // Dopo l'inserimento potrebbero esserci violazioni delle regole del RB-tree.
            this.fixInsert(newNode);
        }
    }

    // Scende nell'albero fino a trovare il punto giusto dove inserire il nuovo nodo.
    // Aggiungiamo il valore a sinistra se è minore, a destra se è maggiore o uguale.
    private insertNode(current: Node, newNode: Node): void {
        if (newNode.value < current.value) {
            if (current.left === null) {
                current.left = newNode;
                newNode.parent = current;
            } else {
                this.insertNode(current.left, newNode);
            }
        } else {
            if (current.right === null) {
                current.right = newNode;
                newNode.parent = current;
            } else {
                this.insertNode(current.right, newNode);
            }
        }
    }

    // Dopo l'inserimento, controlla le proprietà di un albero rosso-nero.
    // La violazione tipica è: "padre rosso e figlio rosso".
    private fixInsert(node: Node): void {
        // Finché il nodo non è la radice e suo padre è rosso,
        // dobbiamo correggere la struttura.
        while (node !== this.root && node.parent?.color === 'red') {
            // Se il padre è figlio sinistro del nonno, il fratello del padre è lo zio.
            if (node.parent === node.parent.parent?.left) {
                const uncle = node.parent.parent.right;

                // Caso 1: lo zio è rosso.
                // Recoloriamo padre, zio e nonno per risolvere localmente la violazione.
                if (uncle?.color === 'red') {
                    node.parent.color = 'black';
                    uncle.color = 'black';
                    node.parent.parent.color = 'red';
                    node = node.parent.parent;
                } else {
                    // Caso 2: il nodo è figlio destro e il padre è figlio sinistro.
                    // Si crea una situazione "triangolare" che richiede prima una rotazione a sinistra.
                    if (node === node.parent.right) {
                        node = node.parent;
                        this.rotateLeft(node);
                    }

                    // Caso 3: il nodo è figlio sinistro del padre.
                    // Recoloriamo e ruotiamo il nonno verso destra.
                    node.parent.color = 'black';
                    node.parent.parent.color = 'red';
                    this.rotateRight(node.parent.parent);
                }
            } else {
                // Simmetrico rispetto al caso precedente: padre è figlio destro del nonno.
                const uncle = node.parent.parent.left;

                // Caso 1 simmetrico: zio rosso.
                if (uncle?.color === 'red') {
                    node.parent.color = 'black';
                    uncle.color = 'black';
                    node.parent.parent.color = 'red';
                    node = node.parent.parent;
                } else {
                    // Caso 2 simmetrico: nodo è figlio sinistro e bisogna prima ruotare a destra.
                    if (node === node.parent.left) {
                        node = node.parent;
                        this.rotateRight(node);
                    }

                    // Caso 3 simmetrico: recolora e ruota il nonno a sinistra.
                    node.parent.color = 'black';
                    node.parent.parent.color = 'red';
                    this.rotateLeft(node.parent.parent);
                }
            }
        }

        // La radice deve essere sempre nera anche dopo la correzione.
        this.root!.color = 'black';
    }

    // Rotazione a sinistra attorno a un nodo.
    // Serve per riallineare la struttura quando si verifica una configurazione "triangolare".
    private rotateLeft(node: Node): void {
        const rightChild = node.right!;

        // Il figlio destro diventa la nuova radice del sottoalbero.
        node.right = rightChild.left;
        if (rightChild.left !== null) {
            rightChild.left.parent = node;
        }

        rightChild.parent = node.parent;
        if (node.parent === null) {
            this.root = rightChild;
        } else if (node === node.parent.left) {
            node.parent.left = rightChild;
        } else {
            node.parent.right = rightChild;
        }

        rightChild.left = node;
        node.parent = rightChild;
    }

    // Rotazione a destra, operazione speculare a rotateLeft.
    // Viene usata per mantenere l'equilibrio dell'albero e rispettare le regole degli alberi rossi-neri.
    private rotateRight(node: Node): void {
        const leftChild = node.left!;

        // Il figlio sinistro diventa la nuova radice del sottoalbero.
        node.left = leftChild.right;
        if (leftChild.right !== null) {
            leftChild.right.parent = node;
        }

        leftChild.parent = node.parent;
        if (node.parent === null) {
            this.root = leftChild;
        } else if (node === node.parent.right) {
            node.parent.right = leftChild;
        } else {
            node.parent.left = leftChild;
        }

        leftChild.right = node;
        node.parent = leftChild;
    }
}