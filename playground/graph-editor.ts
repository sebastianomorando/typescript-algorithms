import { drawGraph, hitEdge, hitNode, nodeRadius, resizeGraphCanvas } from "./graph-canvas";
import { GraphModel } from "./graph-model";
import type { GraphSelection } from "./graph-model";

type Tool = "select" | "node" | "edge";
type Drag = { pointerId: number; id: string; x: number; y: number; offsetX: number; offsetY: number; moved: boolean };

const canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
const selectButton = document.getElementById("select-tool") as HTMLButtonElement;
const nodeButton = document.getElementById("node-tool") as HTMLButtonElement;
const edgeButton = document.getElementById("edge-tool") as HTMLButtonElement;
const automaticButton = document.getElementById("automatic-tool") as HTMLButtonElement;
const deleteButton = document.getElementById("delete-tool") as HTMLButtonElement;
const nodeValueControl = document.getElementById("node-value-control")!;
const nodeValueInput = document.getElementById("node-value") as HTMLInputElement;
const weightControl = document.getElementById("weight-control")!;
const weightInput = document.getElementById("edge-weight") as HTMLInputElement;
const graph = GraphModel.load();
let selection: GraphSelection = null;
let tool: Tool = "select";
let firstNode: string | null = null;
let drag: Drag | null = null;
let frame = 0;

function point(event: PointerEvent | MouseEvent) {
  const bounds = canvas.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
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
  const node = selection?.kind === "node" ? graph.getNode(selection.id) : undefined;
  nodeValueControl.hidden = !node;
  if (node && document.activeElement !== nodeValueInput) nodeValueInput.value = node.value;
  const edge = selection?.kind === "edge" ? graph.getEdge(selection.id) : undefined;
  weightControl.hidden = !edge;
  weightInput.disabled = graph.automatic;
  if (edge && document.activeElement !== weightInput) weightInput.value = String(graph.edgeWeight(edge));
}

function scheduleDraw() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    drawGraph(canvas, graph, selection, firstNode);
    if (graph.automatic && selection?.kind === "edge" && document.activeElement !== weightInput) {
      const edge = graph.getEdge(selection.id);
      if (edge) weightInput.value = String(graph.edgeWeight(edge));
    }
  });
}

function resize() {
  resizeGraphCanvas(canvas);
  scheduleDraw();
}

function setTool(next: Tool) {
  tool = next;
  firstNode = null;
  syncControls();
  scheduleDraw();
}

function addNode(x: number, y: number) {
  const node = graph.addNode(x, y);
  selection = { kind: "node", id: node.id };
  graph.save();
  setTool("select");
  nodeValueInput.focus({ preventScroll: true });
}

function connect(id: string) {
  if (!firstNode) {
    firstNode = id;
    selection = { kind: "node", id };
  } else if (firstNode !== id) {
    const { edge, created } = graph.connectNodes(firstNode, id);
    if (created) graph.save();
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
  graph.removeSelection(selection);
  selection = null;
  firstNode = null;
  graph.save();
  syncControls();
  scheduleDraw();
}

selectButton.onclick = () => setTool("select");
nodeButton.onclick = () => setTool("node");
edgeButton.onclick = () => setTool("edge");
automaticButton.onclick = () => {
  graph.toggleAutomatic();
  graph.save();
  syncControls();
  scheduleDraw();
};
deleteButton.onclick = removeSelection;
nodeValueInput.oninput = () => {
  if (selection?.kind !== "node") return;
  graph.setNodeValue(selection.id, nodeValueInput.value);
  graph.save();
  scheduleDraw();
};
nodeValueInput.onkeydown = event => { if (event.key === "Enter") nodeValueInput.blur(); };
weightInput.onchange = () => {
  const edge = selection?.kind === "edge" ? graph.getEdge(selection.id) : undefined;
  if (!edge || graph.automatic) return;
  const value = Number(weightInput.value);
  if (weightInput.value.trim() && Number.isFinite(value)) {
    graph.setEdgeWeight(edge.id, value);
    graph.save();
    scheduleDraw();
  } else {
    weightInput.value = String(edge.weight);
  }
};
weightInput.onkeydown = event => { if (event.key === "Enter") weightInput.blur(); };

canvas.addEventListener("pointerdown", event => {
  if (event.button !== 0) return;
  const { x, y } = point(event);
  const node = hitNode(graph, x, y);
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
  if (event.shiftKey && node) {
    event.preventDefault();
    if (!firstNode && selection?.kind === "node" && selection.id !== node.id) firstNode = selection.id;
    connect(node.id);
    return;
  }
  firstNode = null;
  if (node) {
    selection = { kind: "node", id: node.id };
    drag = { pointerId: event.pointerId, id: node.id, x: node.x, y: node.y, offsetX: node.x - x, offsetY: node.y - y, moved: false };
    canvas.setPointerCapture(event.pointerId);
  } else {
    const edge = hitEdge(graph, x, y);
    selection = edge ? { kind: "edge", id: edge.id } : null;
  }
  syncControls();
  scheduleDraw();
});

canvas.addEventListener("pointermove", event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const node = graph.getNode(drag.id);
  if (!node) return;
  const { x, y } = point(event);
  const nextX = Math.max(nodeRadius, Math.min(canvas.clientWidth - nodeRadius, x + drag.offsetX));
  const nextY = Math.max(nodeRadius, Math.min(canvas.clientHeight - nodeRadius, y + drag.offsetY));
  if (Math.hypot(nextX - node.x, nextY - node.y) < .1) return;
  graph.moveNode(node.id, nextX, nextY);
  drag.moved = true;
  canvas.classList.add("dragging");
  scheduleDraw();
});

canvas.addEventListener("pointerup", event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  if (drag.moved) graph.save();
  drag = null;
  canvas.classList.remove("dragging");
});

canvas.addEventListener("pointercancel", event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const node = graph.getNode(drag.id);
  if (node) graph.moveNode(node.id, drag.x, drag.y);
  drag = null;
  canvas.classList.remove("dragging");
  scheduleDraw();
});

canvas.addEventListener("dblclick", event => {
  if (tool !== "select") return;
  const { x, y } = point(event);
  const node = hitNode(graph, x, y);
  if (node) {
    selection = { kind: "node", id: node.id };
    syncControls();
    scheduleDraw();
    nodeValueInput.focus({ preventScroll: true });
    nodeValueInput.select();
  } else if (!hitEdge(graph, x, y)) addNode(x, y);
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
