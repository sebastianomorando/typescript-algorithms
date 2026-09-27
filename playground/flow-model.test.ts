import { expect, test } from "bun:test";
import { FlowModel } from "./flow-model";

test("Edmonds–Karp computes maximum flow and respects every capacity", () => {
  const graph = new FlowModel();
  const [s, a, b, c, d, t] = Array.from({ length: 6 }, (_, index) => graph.addNode(index * 40, 0));
  const arcs: Array<[typeof s, typeof s, number]> = [
    [s, a, 16], [s, c, 13], [a, b, 12], [b, c, 9], [c, a, 4],
    [c, d, 14], [d, b, 7], [b, t, 20], [d, t, 4],
  ];
  for (const [from, to, capacity] of arcs) {
    const edge = graph.connectNodes(from.id, to.id).edge;
    graph.setCapacity(edge.id, capacity);
  }

  const result = graph.getMaxFlow(s.id, t.id)!;
  expect(result.value).toBe(23);
  for (const edge of graph.edges) {
    const flow = result.flows.get(edge.id)!;
    expect(flow).toBeGreaterThanOrEqual(0);
    expect(flow).toBeLessThanOrEqual(edge.capacity);
  }
  for (const node of [a, b, c, d]) {
    const inflow = graph.edges.filter(edge => edge.to === node.id).reduce((sum, edge) => sum + result.flows.get(edge.id)!, 0);
    const outflow = graph.edges.filter(edge => edge.from === node.id).reduce((sum, edge) => sum + result.flows.get(edge.id)!, 0);
    expect(inflow).toBe(outflow);
  }
});

test("residual reverse edges reroute an earlier augmenting path", () => {
  const graph = new FlowModel();
  const [s, a, b, c, d, t] = Array.from({ length: 6 }, (_, index) => graph.addNode(index * 30, 0));
  graph.connectNodes(s.id, a.id);
  graph.connectNodes(s.id, b.id);
  const firstRoute = graph.connectNodes(a.id, c.id).edge;
  const rerouted = graph.connectNodes(a.id, d.id).edge;
  const secondRoute = graph.connectNodes(b.id, c.id).edge;
  graph.connectNodes(c.id, t.id);
  graph.connectNodes(d.id, t.id);

  const result = graph.getMaxFlow(s.id, t.id)!;
  expect(result.value).toBe(2);
  expect(result.flows.get(firstRoute.id)).toBe(0);
  expect(result.flows.get(rerouted.id)).toBe(1);
  expect(result.flows.get(secondRoute.id)).toBe(1);
});

test("reverse arcs, capacity edits and disconnected sinks", () => {
  const graph = new FlowModel();
  const source = graph.addNode(0, 0);
  const sink = graph.addNode(100, 0);
  const forward = graph.connectNodes(source.id, sink.id).edge;
  const backward = graph.connectNodes(sink.id, source.id).edge;
  graph.setCapacity(forward.id, 2.5);
  graph.setCapacity(backward.id, 8);
  expect(graph.getMaxFlow(source.id, sink.id)?.value).toBe(2.5);
  expect(graph.getMaxFlow(sink.id, source.id)?.value).toBe(8);

  graph.removeSelection({ kind: "edge", id: forward.id });
  expect(graph.getMaxFlow(source.id, sink.id)?.value).toBe(0);
  expect(graph.getMaxFlow("missing", sink.id)).toBeNull();
  expect(() => graph.setCapacity(backward.id, -1)).toThrow();
});

test("flow networks are saved separately and restored with capacities", () => {
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
    const network = new FlowModel();
    const source = network.addNode(10, 20);
    const sink = network.addNode(80, 20);
    network.setNodeValue(source.id, "S");
    const edge = network.connectNodes(source.id, sink.id).edge;
    network.setCapacity(edge.id, 3.5);
    network.save();

    expect(items.has("graph-lab-v1")).toBe(false);
    const restored = FlowModel.load();
    expect(restored.nodes).toEqual(network.nodes);
    expect(restored.edges).toEqual(network.edges);
    expect(restored.getMaxFlow(source.id, sink.id)?.value).toBe(3.5);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete (globalThis as { localStorage?: Storage }).localStorage;
  }
});
