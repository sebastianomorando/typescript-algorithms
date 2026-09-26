type GraphNode = { id: string; x: number; y: number };
type GraphEdge = { id: string; from: string; to: string; weight: number };
type Graph = { nodes: GraphNode[]; edges: GraphEdge[]; automatic: boolean };
type GraphSelection = { kind: "node" | "edge"; id: string } | null;
type Tool = "select" | "node" | "edge";

const canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;
const selectButton = document.getElementById("select-tool") as HTMLButtonElement;
const nodeButton = document.getElementById("node-tool") as HTMLButtonElement;
const edgeButton = document.getElementById("edge-tool") as HTMLButtonElement;
const automaticButton = document.getElementById("automatic-tool") as HTMLButtonElement;
const deleteButton = document.getElementById("delete-tool") as HTMLButtonElement;
const weightControl = document.getElementById("weight-control")!;
const weightInput = document.getElementById("edge-weight") as HTMLInputElement;
const storageKey = "graph-lab-v1";
const radius = 24;
let graph: Graph = { nodes: [], edges: [], automatic: false };
let selection: GraphSelection = null;
let tool: Tool = "select";
let firstNode: string | null = null;
let drag: { pointerId: number; id: string; x: number; y: number; offsetX: number; offsetY: number; moved: boolean } | null = null;
let frame = 0;

function load(): Graph {
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
    return { nodes, edges, automatic: saved.automatic === true };
  } catch { return graph; }
}

graph = load();

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(graph)); } catch { /* Storage can be unavailable. */ }
}

function point(event: PointerEvent | MouseEvent) {
  const bounds = canvas.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

function getNode(id: string) { return graph.nodes.find(node => node.id === id); }
function getEdge(id: string) { return graph.edges.find(edge => edge.id === id); }
function weight(edge: GraphEdge) {
  if (!graph.automatic) return edge.weight;
  const from = getNode(edge.from)!;
  const to = getNode(edge.to)!;
  return Math.round(Math.hypot(to.x - from.x, to.y - from.y));
}

function syncControls() {
  for (const [name, button] of [["select", selectButton], ["node", nodeButton], ["edge", edgeButton]] as const) {
    button.classList.toggle("active", tool === name);
    button.setAttribute("aria-pressed", String(tool === name));
  }
  canvas.classList.toggle("node-mode", tool === "node");
  canvas.classList.toggle("edge-mode", tool === "edge");
  automaticButton.setAttribute("aria-pressed", String(graph.automatic));
  deleteButton.disabled = selection === null;
  const edge = selection?.kind === "edge" ? getEdge(selection.id) : undefined;
  weightControl.hidden = !edge;
  weightInput.disabled = graph.automatic;
  if (edge && document.activeElement !== weightInput) weightInput.value = String(weight(edge));
}

function scheduleDraw() {
  if (frame) return;
  frame = requestAnimationFrame(() => { frame = 0; draw(); });
}

function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  context.clearRect(0, 0, width, height);

  for (const edge of graph.edges) {
    const from = getNode(edge.from);
    const to = getNode(edge.to);
    if (!from || !to) continue;
    const selected = selection?.kind === "edge" && selection.id === edge.id;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.strokeStyle = selected ? "#397653" : "#98ac92";
    context.lineWidth = selected ? 3 : 2;
    context.stroke();

    const value = String(weight(edge));
    const x = (from.x + to.x) / 2;
    const y = (from.y + to.y) / 2;
    context.font = "600 12px 'DM Sans', sans-serif";
    const labelWidth = Math.max(26, context.measureText(value).width + 16);
    context.fillStyle = selected ? "#397653" : "#ffffff";
    context.strokeStyle = selected ? "#397653" : "#dce5d8";
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(x - labelWidth / 2, y - 12, labelWidth, 24, 7);
    context.fill();
    context.stroke();
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = selected ? "#ffffff" : "#52684e";
    context.fillText(value, x, y + .5);
  }

  for (const node of graph.nodes) {
    const selected = selection?.kind === "node" && selection.id === node.id;
    const pending = firstNode === node.id;
    if (selected || pending) {
      context.beginPath();
      context.arc(node.x, node.y, radius + 7, 0, Math.PI * 2);
      context.strokeStyle = "#7a9b6b";
      context.lineWidth = 2;
      context.setLineDash(pending ? [4, 4] : []);
      context.stroke();
      context.setLineDash([]);
    }
    context.beginPath();
    context.arc(node.x, node.y, radius, 0, Math.PI * 2);
    context.fillStyle = "#397653";
    context.fill();
    context.strokeStyle = "#ffffff";
    context.lineWidth = 3;
    context.stroke();
  }
  if (graph.automatic && selection?.kind === "edge" && document.activeElement !== weightInput) {
    const edge = getEdge(selection.id);
    if (edge) weightInput.value = String(weight(edge));
  }
}

function resize() {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  scheduleDraw();
}

function hitNode(x: number, y: number) {
  return [...graph.nodes].reverse().find(node => Math.hypot(node.x - x, node.y - y) <= radius + 5);
}

function hitEdge(x: number, y: number) {
  let nearest: GraphEdge | undefined;
  let nearestDistance = 10;
  for (const edge of graph.edges) {
    const from = getNode(edge.from)!;
    const to = getNode(edge.to)!;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const lengthSquared = dx * dx + dy * dy;
    if (!lengthSquared) continue;
    const t = Math.max(0, Math.min(1, ((x - from.x) * dx + (y - from.y) * dy) / lengthSquared));
    const distance = Math.hypot(x - (from.x + t * dx), y - (from.y + t * dy));
    if (distance < nearestDistance) { nearest = edge; nearestDistance = distance; }
  }
  return nearest;
}

function setTool(next: Tool) {
  tool = next;
  firstNode = null;
  syncControls();
  scheduleDraw();
}

function addNode(x: number, y: number) {
  const node = { id: crypto.randomUUID(), x, y };
  graph.nodes.push(node);
  selection = { kind: "node", id: node.id };
  save();
  setTool("select");
}

function connect(id: string) {
  if (!firstNode) {
    firstNode = id;
    selection = { kind: "node", id };
  } else if (firstNode !== id) {
    let edge = graph.edges.find(edge => (edge.from === firstNode && edge.to === id) || (edge.from === id && edge.to === firstNode));
    if (!edge) {
      edge = { id: crypto.randomUUID(), from: firstNode, to: id, weight: 1 };
      graph.edges.push(edge);
      save();
    }
    selection = { kind: "edge", id: edge.id };
    setTool("select");
  } else {
    firstNode = null;
  }
  syncControls();
  scheduleDraw();
}

function removeSelection() {
  if (!selection) return;
  if (selection.kind === "node") {
    graph.nodes = graph.nodes.filter(node => node.id !== selection!.id);
    graph.edges = graph.edges.filter(edge => edge.from !== selection!.id && edge.to !== selection!.id);
  } else {
    graph.edges = graph.edges.filter(edge => edge.id !== selection!.id);
  }
  selection = null;
  firstNode = null;
  save();
  syncControls();
  scheduleDraw();
}

selectButton.onclick = () => setTool("select");
nodeButton.onclick = () => setTool("node");
edgeButton.onclick = () => setTool("edge");
automaticButton.onclick = () => {
  graph.automatic = !graph.automatic;
  save();
  syncControls();
  scheduleDraw();
};
deleteButton.onclick = removeSelection;
weightInput.onchange = () => {
  const edge = selection?.kind === "edge" ? getEdge(selection.id) : undefined;
  if (!edge || graph.automatic) return;
  const value = Number(weightInput.value);
  if (weightInput.value.trim() && Number.isFinite(value)) {
    edge.weight = value;
    save();
    scheduleDraw();
  } else {
    weightInput.value = String(edge.weight);
  }
};
weightInput.onkeydown = event => { if (event.key === "Enter") weightInput.blur(); };

canvas.addEventListener("pointerdown", event => {
  if (event.button !== 0) return;
  const { x, y } = point(event);
  const node = hitNode(x, y);
  canvas.focus({ preventScroll: true });
  if (tool === "node") {
    if (node) { selection = { kind: "node", id: node.id }; setTool("select"); }
    else addNode(x, y);
    syncControls();
    scheduleDraw();
    return;
  }
  if (tool === "edge") {
    if (node) connect(node.id);
    return;
  }
  if (node) {
    selection = { kind: "node", id: node.id };
    drag = { pointerId: event.pointerId, id: node.id, x: node.x, y: node.y, offsetX: node.x - x, offsetY: node.y - y, moved: false };
    canvas.setPointerCapture(event.pointerId);
  } else {
    const edge = hitEdge(x, y);
    selection = edge ? { kind: "edge", id: edge.id } : null;
  }
  syncControls();
  scheduleDraw();
});

canvas.addEventListener("pointermove", event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const node = getNode(drag.id);
  if (!node) return;
  const { x, y } = point(event);
  const nextX = Math.max(radius, Math.min(canvas.clientWidth - radius, x + drag.offsetX));
  const nextY = Math.max(radius, Math.min(canvas.clientHeight - radius, y + drag.offsetY));
  if (Math.hypot(nextX - node.x, nextY - node.y) < .1) return;
  node.x = nextX;
  node.y = nextY;
  drag.moved = true;
  canvas.classList.add("dragging");
  scheduleDraw();
});

canvas.addEventListener("pointerup", event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  if (drag.moved) save();
  drag = null;
  canvas.classList.remove("dragging");
});

canvas.addEventListener("pointercancel", event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const node = getNode(drag.id);
  if (node) { node.x = drag.x; node.y = drag.y; }
  drag = null;
  canvas.classList.remove("dragging");
  scheduleDraw();
});

canvas.addEventListener("dblclick", event => {
  if (tool !== "select") return;
  const { x, y } = point(event);
  if (!hitNode(x, y) && !hitEdge(x, y)) addNode(x, y);
});

document.addEventListener("keydown", event => {
  if (event.target instanceof HTMLInputElement) return;
  if (event.key === "Delete" || event.key === "Backspace") {
    if (selection) { event.preventDefault(); removeSelection(); }
  } else if (event.key === "Escape") {
    setTool("select");
  }
});

new ResizeObserver(resize).observe(canvas);
window.addEventListener("resize", resize);
syncControls();
resize();
