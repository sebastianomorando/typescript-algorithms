import { expect, test } from "bun:test";
import { GraphModel } from "./graph-model";

test("graph weights follow moved nodes and removing a node removes its edges", () => {
  const graph = new GraphModel();
  const first = graph.addNode(0, 0);
  const second = graph.addNode(3, 4);
  const { edge } = graph.connectNodes(first.id, second.id);

  graph.setEdgeWeight(edge.id, 7);
  expect(graph.edgeWeight(graph.getEdge(edge.id)!)).toBe(7);
  expect(graph.connectNodes(second.id, first.id).created).toBe(false);
  expect(graph.edges).toHaveLength(1);

  graph.toggleAutomatic();
  expect(graph.edgeWeight(graph.getEdge(edge.id)!)).toBe(5);
  graph.moveNode(second.id, 6, 8);
  expect(graph.edgeWeight(graph.getEdge(edge.id)!)).toBe(10);

  graph.removeSelection({ kind: "node", id: first.id });
  expect(graph.nodes).toHaveLength(1);
  expect(graph.edges).toHaveLength(0);
});

test("saved graphs keep the existing storage format and can be loaded", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const items = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => { items.set(key, value); },
    },
  });
  try {
    const graph = new GraphModel();
    const first = graph.addNode(10, 20);
    const second = graph.addNode(40, 60);
    const { edge } = graph.connectNodes(first.id, second.id);
    graph.setEdgeWeight(edge.id, 12);
    graph.toggleAutomatic();
    graph.save();

    expect(JSON.parse(items.get("graph-lab-v1")!)).toEqual({
      nodes: graph.nodes,
      edges: graph.edges,
      automatic: true,
    });
    const loaded = GraphModel.load();
    expect(loaded.nodes).toEqual(graph.nodes);
    expect(loaded.edges).toEqual(graph.edges);
    expect(loaded.automatic).toBe(true);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete (globalThis as { localStorage?: Storage }).localStorage;
  }
});
