export type GraphNode = Readonly<{ id: string; x: number; y: number }>;
export type GraphEdge = Readonly<{ id: string; from: string; to: string; weight: number }>;
export type GraphSelection = { kind: "node" | "edge"; id: string } | null;

const storageKey = "graph-lab-v1";

export class GraphModel {
  #nodes: GraphNode[] = [];
  #edges: GraphEdge[] = [];
  #automatic = false;

  get nodes(): readonly GraphNode[] { return this.#nodes; }
  get edges(): readonly GraphEdge[] { return this.#edges; }
  get automatic(): boolean { return this.#automatic; }

  static load(): GraphModel {
    const graph = new GraphModel();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (!saved || !Array.isArray(saved.nodes) || !Array.isArray(saved.edges)) return graph;
      const nodes: GraphNode[] = saved.nodes.filter((node: GraphNode) =>
        typeof node?.id === "string" && Number.isFinite(node.x) && Number.isFinite(node.y));
      const ids = new Set(nodes.map(node => node.id));
      const pairs = new Set<string>();
      const edges: GraphEdge[] = saved.edges.filter((edge: GraphEdge) => {
        if (typeof edge?.id !== "string" || !ids.has(edge.from) || !ids.has(edge.to) ||
          edge.from === edge.to || !Number.isFinite(edge.weight)) return false;
        const pair = [edge.from, edge.to].sort().join("|");
        if (pairs.has(pair)) return false;
        pairs.add(pair);
        return true;
      });
      graph.#nodes = nodes;
      graph.#edges = edges;
      graph.#automatic = saved.automatic === true;
    } catch { /* Use an empty graph when storage is unavailable or invalid. */ }
    return graph;
  }

  save(): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        nodes: this.#nodes, edges: this.#edges, automatic: this.#automatic,
      }));
    } catch { /* Storage can be unavailable. */ }
  }

  getNode(id: string): GraphNode | undefined { return this.#nodes.find(node => node.id === id); }
  getEdge(id: string): GraphEdge | undefined { return this.#edges.find(edge => edge.id === id); }

  edgeWeight(edge: GraphEdge): number {
    if (!this.#automatic) return edge.weight;
    const from = this.getNode(edge.from)!;
    const to = this.getNode(edge.to)!;
    return Math.round(Math.hypot(to.x - from.x, to.y - from.y));
  }

  addNode(x: number, y: number): GraphNode {
    const node = { id: crypto.randomUUID(), x, y };
    this.#nodes.push(node);
    return node;
  }

  moveNode(id: string, x: number, y: number): void {
    const index = this.#nodes.findIndex(node => node.id === id);
    if (index !== -1) this.#nodes[index] = { ...this.#nodes[index], x, y };
  }

  connectNodes(from: string, to: string): { edge: GraphEdge; created: boolean } {
    const existing = this.#edges.find(edge =>
      (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from));
    if (existing) return { edge: existing, created: false };
    const edge = { id: crypto.randomUUID(), from, to, weight: 1 };
    this.#edges.push(edge);
    return { edge, created: true };
  }

  setEdgeWeight(id: string, weight: number): void {
    const index = this.#edges.findIndex(edge => edge.id === id);
    if (index !== -1) this.#edges[index] = { ...this.#edges[index], weight };
  }

  toggleAutomatic(): void { this.#automatic = !this.#automatic; }

  removeSelection(selection: NonNullable<GraphSelection>): void {
    if (selection.kind === "node") {
      this.#nodes = this.#nodes.filter(node => node.id !== selection.id);
      this.#edges = this.#edges.filter(edge => edge.from !== selection.id && edge.to !== selection.id);
    } else {
      this.#edges = this.#edges.filter(edge => edge.id !== selection.id);
    }
  }
}
