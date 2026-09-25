import type { Graph } from "./Graph";

const DFS = <T>(graph: Graph<T>, start: T): T[] => {
    const colors: Map<T, 'white' | 'gray' | 'black'> = new Map();
    const result: T[] = [];
    const distances: Map<T, number> = new Map();
    const predecessors: Map<T, T | null> = new Map();

    for (const vertex of graph.vertices()) {
        colors.set(vertex, 'white');
        distances.set(vertex, Infinity);
        predecessors.set(vertex, null);
    }

    const dfsVisit = (vertex: T) => {
        colors.set(vertex, 'gray');
        result.push(vertex);

        const neighbors = graph.neighbors(vertex);
        if (neighbors) {
            for (const neighbor of neighbors) {
                if (colors.get(neighbor.to) === 'white') {
                    distances.set(neighbor.to, distances.get(vertex)! + neighbor.weight);
                    predecessors.set(neighbor.to, vertex);
                    dfsVisit(neighbor.to);
                }
            }
        }

        colors.set(vertex, 'black');
    };

    dfsVisit(start);
    return result;
};

export default DFS;