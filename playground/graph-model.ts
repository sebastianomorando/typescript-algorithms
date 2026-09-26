export type GraphNode = Readonly<{ id: string; x: number; y: number; value: string }>;
export type GraphEdge = Readonly<{ id: string; from: string; to: string; weight: number }>;
export type GraphSelection = { kind: "node" | "edge"; id: string } | null;
export type GraphNeighbor = Readonly<{ node: GraphNode; edge: GraphEdge }>;

const storageKey = "graph-lab-v1";

export class GraphModel {
  #nodes = new Map<string, GraphNode>();
  #edges = new Map<string, GraphEdge>();
  #adjacency = new Map<string, Map<string, string>>();
  #automatic = false;

  get nodes(): readonly GraphNode[] { return [...this.#nodes.values()]; }
  get edges(): readonly GraphEdge[] { return [...this.#edges.values()]; }
  get automatic(): boolean { return this.#automatic; }

  static load(): GraphModel {
    const graph = new GraphModel();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (!saved || !Array.isArray(saved.nodes) || !Array.isArray(saved.edges)) return graph;
      for (const node of saved.nodes as GraphNode[]) {
        if (typeof node?.id !== "string" || !Number.isFinite(node.x) || !Number.isFinite(node.y) || graph.#nodes.has(node.id)) continue;
        graph.#nodes.set(node.id, { id: node.id, x: node.x, y: node.y, value: typeof node.value === "string" ? node.value : "" });
        graph.#adjacency.set(node.id, new Map());
      }
      for (const edge of saved.edges as GraphEdge[]) {
        if (typeof edge?.id !== "string" || !graph.#nodes.has(edge.from) || !graph.#nodes.has(edge.to) ||
          edge.from === edge.to || !Number.isFinite(edge.weight) || graph.#edges.has(edge.id) ||
          graph.#adjacency.get(edge.from)!.has(edge.to)) continue;
        const stored = { id: edge.id, from: edge.from, to: edge.to, weight: edge.weight };
        graph.#edges.set(edge.id, stored);
        graph.#adjacency.get(edge.from)!.set(edge.to, edge.id);
        graph.#adjacency.get(edge.to)!.set(edge.from, edge.id);
      }
      graph.#automatic = saved.automatic === true;
    } catch { /* Use an empty graph when storage is unavailable or invalid. */ }
    return graph;
  }

  save(): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        nodes: this.nodes, edges: this.edges, automatic: this.#automatic,
      }));
    } catch { /* Storage can be unavailable. */ }
  }

  getNode(id: string): GraphNode | undefined { return this.#nodes.get(id); }
  getEdge(id: string): GraphEdge | undefined { return this.#edges.get(id); }

  neighbors(id: string): readonly GraphNeighbor[] {
    return [...(this.#adjacency.get(id)?.entries() ?? [])].map(([nodeId, edgeId]) => ({
      node: this.#nodes.get(nodeId)!, edge: this.#edges.get(edgeId)!,
    }));
  }

  edgeWeight(edge: GraphEdge): number {
    if (!this.#automatic) return edge.weight;
    const from = this.getNode(edge.from)!;
    const to = this.getNode(edge.to)!;
    return Math.round(Math.hypot(to.x - from.x, to.y - from.y));
  }

  addNode(x: number, y: number): GraphNode {
    const node = { id: crypto.randomUUID(), x, y, value: "" };
    this.#nodes.set(node.id, node);
    this.#adjacency.set(node.id, new Map());
    return node;
  }

  setNodeValue(id: string, value: string): void {
    const node = this.#nodes.get(id);
    if (node) this.#nodes.set(id, { ...node, value });
  }

  moveNode(id: string, x: number, y: number): void {
    const node = this.#nodes.get(id);
    if (node) this.#nodes.set(id, { ...node, x, y });
  }

  connectNodes(from: string, to: string): { edge: GraphEdge; created: boolean } {
    const fromList = this.#adjacency.get(from);
    const toList = this.#adjacency.get(to);
    if (!fromList || !toList || from === to) throw new Error("Invalid graph connection");
    const existingId = fromList.get(to);
    if (existingId) return { edge: this.#edges.get(existingId)!, created: false };
    const edge = { id: crypto.randomUUID(), from, to, weight: 1 };
    this.#edges.set(edge.id, edge);
    fromList.set(to, edge.id);
    toList.set(from, edge.id);
    return { edge, created: true };
  }

  setEdgeWeight(id: string, weight: number): void {
    const edge = this.#edges.get(id);
    if (edge) this.#edges.set(id, { ...edge, weight });
  }

  toggleAutomatic(): void { this.#automatic = !this.#automatic; }

  removeSelection(selection: NonNullable<GraphSelection>): void {
    if (selection.kind === "node") {
      const neighbors = this.#adjacency.get(selection.id);
      if (!neighbors) return;
      for (const [nodeId, edgeId] of neighbors) {
        this.#edges.delete(edgeId);
        this.#adjacency.get(nodeId)?.delete(selection.id);
      }
      this.#adjacency.delete(selection.id);
      this.#nodes.delete(selection.id);
    } else {
      const edge = this.#edges.get(selection.id);
      if (!edge) return;
      this.#edges.delete(edge.id);
      this.#adjacency.get(edge.from)?.delete(edge.to);
      this.#adjacency.get(edge.to)?.delete(edge.from);
    }
  }
}
