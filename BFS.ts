import type { Graph } from "./Graph";

export type Edge<T> = {
    to: T;
    weight: number;
}

const BFS = <T>(graph: Graph<T>, start: T): T[] => {
    const colors: Map<T, 'white' | 'gray' | 'black'> = new Map();
    const queue: T[] = [];
    const result: T[] = [];
    const distances: Map<T, number> = new Map();
    const predecessors: Map<T, T | null> = new Map();

    for (const vertex of graph.vertices()) {
        colors.set(vertex, 'white');
        distances.set(vertex, Infinity);
        predecessors.set(vertex, null);
    }

    colors.set(start, 'gray');
    distances.set(start, 0);
    queue.push(start);

    while (queue.length > 0) {
        const current = queue.shift()!;
        result.push(current);

        const neighbors = graph.neighbors(current);
        if (neighbors) {
            for (const neighbor of neighbors) {
                if (colors.get(neighbor.to) === 'white') {
                    colors.set(neighbor.to, 'gray');
                    distances.set(neighbor.to, distances.get(current)! + neighbor.weight);
                    predecessors.set(neighbor.to, current);
                    queue.push(neighbor.to);
                }
            }
        }

        colors.set(current, 'black');
    }

    return result;
    
};

export default BFS;