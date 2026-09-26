import { expect, test } from "bun:test";
import { GraphModel } from "./graph-model";

test("graph weights follow moved nodes and removing a node removes its edges", () => {
  const graph = new GraphModel();
  const first = graph.addNode(0, 0);
  const second = graph.addNode(3, 4);
  const { edge } = graph.connectNodes(first.id, second.id);
  graph.setNodeValue(first.id, "inizio");
  expect(graph.getNode(first.id)?.value).toBe("inizio");

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

test("adjacency lists stay symmetric when edges and nodes are removed", () => {
  const graph = new GraphModel();
  const first = graph.addNode(0, 0);
  const second = graph.addNode(10, 0);
  const third = graph.addNode(20, 0);
  const firstEdge = graph.connectNodes(first.id, second.id).edge;
  graph.connectNodes(first.id, third.id);

  expect(graph.neighbors(first.id).map(({ node }) => node.id)).toEqual([second.id, third.id]);
  expect(graph.neighbors(second.id).map(({ edge }) => edge.id)).toEqual([firstEdge.id]);
  graph.removeSelection({ kind: "edge", id: firstEdge.id });
  expect(graph.neighbors(first.id).map(({ node }) => node.id)).toEqual([third.id]);
  expect(graph.neighbors(second.id)).toEqual([]);

  graph.removeSelection({ kind: "node", id: first.id });
  expect(graph.neighbors(third.id)).toEqual([]);
  expect(graph.edges).toEqual([]);
});

test("shortest path follows weighted edges and handles disconnected nodes", () => {
  const graph = new GraphModel();
  const start = graph.addNode(0, 0);
  const first = graph.addNode(10, 0);
  const second = graph.addNode(20, 0);
  const end = graph.addNode(30, 0);
  const direct = graph.connectNodes(start.id, end.id).edge;
  const one = graph.connectNodes(start.id, first.id).edge;
  const two = graph.connectNodes(first.id, second.id).edge;
  const three = graph.connectNodes(second.id, end.id).edge;
  graph.setEdgeWeight(direct.id, 20);
  graph.setEdgeWeight(one.id, 2);
  graph.setEdgeWeight(two.id, 3);
  graph.setEdgeWeight(three.id, 4);

  expect(graph.getShortestPath(start.id, end.id)).toEqual({ path: [start, first, second, end], distance: 9 });
  graph.removeSelection({ kind: "edge", id: two.id });
  expect(graph.getShortestPath(start.id, end.id)).toEqual({ path: [start, end], distance: 20 });
  graph.removeSelection({ kind: "edge", id: direct.id });
  expect(graph.getShortestPath(start.id, end.id)).toBeNull();
  expect(graph.getShortestPath(start.id, start.id)).toEqual({ path: [start], distance: 0 });
  expect(graph.getShortestPath("missing", end.id)).toBeNull();
});

test("shortest path uses automatic lengths after moving a node", () => {
  const graph = new GraphModel();
  const start = graph.addNode(0, 0);
  const end = graph.addNode(3, 4);
  const edge = graph.connectNodes(start.id, end.id).edge;
  graph.setEdgeWeight(edge.id, 99);
  expect(graph.getShortestPath(start.id, end.id)?.distance).toBe(99);

  graph.toggleAutomatic();
  expect(graph.getShortestPath(start.id, end.id)?.distance).toBe(5);
  graph.moveNode(end.id, 6, 8);
  expect(graph.getShortestPath(start.id, end.id)?.distance).toBe(10);

  graph.toggleAutomatic();
  graph.setEdgeWeight(edge.id, -1);
  expect(graph.getShortestPath(start.id, end.id)).toBeNull();
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
    graph.setNodeValue(first.id, "origine");
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
    expect(loaded.neighbors(first.id).map(({ node }) => node.id)).toEqual([second.id]);
    expect(loaded.automatic).toBe(true);
    expect(loaded.getNode(first.id)?.value).toBe("origine");

    items.set("graph-lab-v1", JSON.stringify({
      nodes: [{ id: "legacy", x: 1, y: 2 }], edges: [], automatic: false,
    }));
    expect(GraphModel.load().getNode("legacy")?.value).toBe("");
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete (globalThis as { localStorage?: Storage }).localStorage;
  }
});
