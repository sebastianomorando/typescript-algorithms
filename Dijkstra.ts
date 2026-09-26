import { Graph } from "./Graph";

const Dijkstra = <T>(graph: Graph<T>, start: T): [Map<T, number>, Map<T, T | null>] => {
    const distances: Map<T, number> = new Map();
    const predecessors: Map<T, T | null> = new Map();
    const visited: Set<T> = new Set();

    for (const vertex of graph.vertices()) {
        distances.set(vertex, Infinity);
        predecessors.set(vertex, null);
    }

    distances.set(start, 0);

    while (visited.size < graph.vertices().length) {
        let currentVertex: T | null = null;
        let currentDistance = Infinity;

        for (const [vertex, distance] of distances.entries()) {
            if (!visited.has(vertex) && distance < currentDistance) {
                currentDistance = distance;
                currentVertex = vertex;
            }
        }

        if (currentVertex === null) {
            break; // All remaining vertices are inaccessible from start
        }

        visited.add(currentVertex);

        const neighbors = graph.neighbors(currentVertex);
        if (neighbors) {
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.to)) {
                    const newDistance = currentDistance + neighbor.weight;
                    if (newDistance < distances.get(neighbor.to)!) {
                        distances.set(neighbor.to, newDistance);
                        predecessors.set(neighbor.to, currentVertex);
                    }
                }
            }
        }
    }

    return [distances, predecessors];
};

export default Dijkstra;