export type FlowNode = Readonly<{ id: string; x: number; y: number; value: string }>;
export type FlowEdge = Readonly<{ id: string; from: string; to: string; capacity: number }>;
export type FlowSelection = { kind: "node" | "edge"; id: string } | null;
export type MaxFlowResult = { value: number; flows: Map<string, number> };

type ResidualEdge = { to: string; capacity: number; reverse: number; edgeId: string; direction: 1 | -1 };
const storageKey = "flow-lab-v1";
const epsilon = 1e-9;

export class FlowModel {
  #nodes = new Map<string, FlowNode>();
  #edges = new Map<string, FlowEdge>();
  #outgoing = new Map<string, Map<string, string>>();

  get nodes(): readonly FlowNode[] { return [...this.#nodes.values()]; }
  get edges(): readonly FlowEdge[] { return [...this.#edges.values()]; }
  getNode(id: string): FlowNode | undefined { return this.#nodes.get(id); }
  getEdge(id: string): FlowEdge | undefined { return this.#edges.get(id); }
  getEdgeBetween(from: string, to: string): FlowEdge | undefined {
    const id = this.#outgoing.get(from)?.get(to);
    return id ? this.#edges.get(id) : undefined;
  }

  static load(): FlowModel {
    const model = new FlowModel();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (!saved || !Array.isArray(saved.nodes) || !Array.isArray(saved.edges)) return model;
      for (const node of saved.nodes as FlowNode[]) {
        if (typeof node?.id !== "string" || !Number.isFinite(node.x) || !Number.isFinite(node.y) || model.#nodes.has(node.id)) continue;
        model.#nodes.set(node.id, { id: node.id, x: node.x, y: node.y, value: typeof node.value === "string" ? node.value : "" });
        model.#outgoing.set(node.id, new Map());
      }
      for (const edge of saved.edges as FlowEdge[]) {
        if (typeof edge?.id !== "string" || !model.#nodes.has(edge.from) || !model.#nodes.has(edge.to) ||
          edge.from === edge.to || !Number.isFinite(edge.capacity) || edge.capacity < 0 ||
          model.#edges.has(edge.id) || model.#outgoing.get(edge.from)!.has(edge.to)) continue;
        model.#edges.set(edge.id, { id: edge.id, from: edge.from, to: edge.to, capacity: edge.capacity });
        model.#outgoing.get(edge.from)!.set(edge.to, edge.id);
      }
    } catch { /* Storage can be unavailable. */ }
    return model;
  }

  save(): void {
    try { localStorage.setItem(storageKey, JSON.stringify({ nodes: this.nodes, edges: this.edges })); }
    catch { /* Storage can be unavailable. */ }
  }

  addNode(x: number, y: number): FlowNode {
    const node = { id: crypto.randomUUID(), x, y, value: "" };
    this.#nodes.set(node.id, node);
    this.#outgoing.set(node.id, new Map());
    return node;
  }

  moveNode(id: string, x: number, y: number): void {
    const node = this.#nodes.get(id);
    if (node) this.#nodes.set(id, { ...node, x, y });
  }

  setNodeValue(id: string, value: string): void {
    const node = this.#nodes.get(id);
    if (node) this.#nodes.set(id, { ...node, value });
  }

  connectNodes(from: string, to: string): { edge: FlowEdge; created: boolean } {
    if (!this.#nodes.has(from) || !this.#nodes.has(to) || from === to) throw new Error("Invalid flow connection");
    const existing = this.getEdgeBetween(from, to);
    if (existing) return { edge: existing, created: false };
    const edge = { id: crypto.randomUUID(), from, to, capacity: 1 };
    this.#edges.set(edge.id, edge);
    this.#outgoing.get(from)!.set(to, edge.id);
    return { edge, created: true };
  }

  setCapacity(id: string, capacity: number): void {
    if (!Number.isFinite(capacity) || capacity < 0) throw new Error("Invalid capacity");
    const edge = this.#edges.get(id);
    if (edge) this.#edges.set(id, { ...edge, capacity });
  }

  removeSelection(selection: NonNullable<FlowSelection>): void {
    if (selection.kind === "edge") {
      const edge = this.#edges.get(selection.id);
      if (!edge) return;
      this.#edges.delete(edge.id);
      this.#outgoing.get(edge.from)?.delete(edge.to);
      return;
    }
    if (!this.#nodes.has(selection.id)) return;
    for (const edge of this.#edges.values()) {
      if (edge.from === selection.id || edge.to === selection.id) {
        this.#edges.delete(edge.id);
        this.#outgoing.get(edge.from)?.delete(edge.to);
      }
    }
    this.#outgoing.delete(selection.id);
    this.#nodes.delete(selection.id);
  }

  getMaxFlow(source: string, sink: string): MaxFlowResult | null {
    if (!this.#nodes.has(source) || !this.#nodes.has(sink)) return null;
    const flows = new Map<string, number>([...this.#edges.keys()].map(id => [id, 0]));
    if (source === sink) return { value: 0, flows };

    const residual = new Map<string, ResidualEdge[]>([...this.#nodes.keys()].map(id => [id, []] as const));
    for (const edge of this.#edges.values()) {
      const outgoing = residual.get(edge.from)!;
      const incoming = residual.get(edge.to)!;
      const forwardIndex = outgoing.length;
      const reverseIndex = incoming.length;
      outgoing.push({ to: edge.to, capacity: edge.capacity, reverse: reverseIndex, edgeId: edge.id, direction: 1 });
      incoming.push({ to: edge.from, capacity: 0, reverse: forwardIndex, edgeId: edge.id, direction: -1 });
    }

    let value = 0;
    while (true) {
      const previous = new Map<string, { from: string; index: number }>();
      const queue = [source];
      const visited = new Set([source]);
      for (let head = 0; head < queue.length && !visited.has(sink); head++) {
        const from = queue[head]!;
        for (const [index, edge] of residual.get(from)!.entries()) {
          if (edge.capacity <= epsilon || visited.has(edge.to)) continue;
          visited.add(edge.to);
          previous.set(edge.to, { from, index });
          queue.push(edge.to);
          if (edge.to === sink) break;
        }
      }
      if (!previous.has(sink)) break;

      let amount = Infinity;
      for (let id = sink; id !== source;) {
        const step = previous.get(id)!;
        amount = Math.min(amount, residual.get(step.from)![step.index]!.capacity);
        id = step.from;
      }
      for (let id = sink; id !== source;) {
        const step = previous.get(id)!;
        const edge = residual.get(step.from)![step.index]!;
        edge.capacity -= amount;
        residual.get(edge.to)![edge.reverse]!.capacity += amount;
        flows.set(edge.edgeId, (flows.get(edge.edgeId) ?? 0) + amount * edge.direction);
        id = step.from;
      }
      value += amount;
    }
    return { value, flows };
  }
}
