import type { Edge } from "./BFS";


export class Graph<T = string> {
    private adjaceny: Map<T, Set<Edge<T>>> = new Map();

    addVertex(vertex: T): void {
        if (!this.adjaceny.has(vertex)) {
            this.adjaceny.set(vertex, new Set());
        }
    }

    addEdge(from: T, to: T, weight: number = 1): void {
        this.addVertex(from);
        this.addVertex(to);
        this.adjaceny.get(from)?.add({ to, weight });
    }

    neighbors(vertex: T): Set<Edge<T>> | undefined {
        return this.adjaceny.get(vertex);
    }

    vertices(): IterableIterator<T> {
        return this.adjaceny.keys();
    }

    hasEdge(from: T, to: T): boolean {
        return this.adjaceny.get(from)?.has({ to, weight: 1 }) ?? false;
    }
}
