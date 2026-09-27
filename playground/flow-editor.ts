import { drawFlowCanvas, flowNodeRadius, hitFlowEdge, hitFlowNode, resizeFlowCanvas } from "./flow-canvas";
import { FlowModel } from "./flow-model";
import type { FlowSelection, MaxFlowResult } from "./flow-model";

type Tool = "select" | "node" | "edge";
type Drag = { pointerId: number; id: string; x: number; y: number; offsetX: number; offsetY: number; moved: boolean };

const canvas = document.getElementById("graph-canvas") as HTMLCanvasElement;
const selectButton = document.getElementById("select-tool") as HTMLButtonElement;
const nodeButton = document.getElementById("node-tool") as HTMLButtonElement;
const edgeButton = document.getElementById("edge-tool") as HTMLButtonElement;
const deleteButton = document.getElementById("delete-tool") as HTMLButtonElement;
const nodeValueControl = document.getElementById("node-value-control")!;
const nodeValueInput = document.getElementById("node-value") as HTMLInputElement;
const capacityControl = document.getElementById("capacity-control")!;
const capacityInput = document.getElementById("edge-capacity") as HTMLInputElement;
const flowResult = document.getElementById("flow-result")!;
const maxFlowValue = document.getElementById("max-flow-value")!;
const contextMenu = document.getElementById("flow-context-menu")!;
const sourceButton = document.getElementById("flow-source") as HTMLButtonElement;
const sinkButton = document.getElementById("flow-sink") as HTMLButtonElement;
const model = FlowModel.load();
let selection: FlowSelection = null;
let tool: Tool = "select";
let firstNode: string | null = null;
let sourceId: string | null = null;
let sinkId: string | null = null;
let contextNodeId: string | null = null;
let result: MaxFlowResult | null = null;
let drag: Drag | null = null;
let frame = 0;

function point(event: PointerEvent | MouseEvent) {
  const bounds = canvas.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

function displayNumber(value: number) { return Number.isFinite(value) ? String(Number(value.toPrecision(6))) : String(value); }

function syncControls() {
  for (const [name, button] of [["select", selectButton], ["node", nodeButton], ["edge", edgeButton]] as const) {
    button.classList.toggle("active", tool === name);
    button.setAttribute("aria-pressed", String(tool === name));
  }
  canvas.classList.toggle("node-mode", tool === "node");
  canvas.classList.toggle("edge-mode", tool === "edge");
  deleteButton.disabled = selection === null;
  const node = selection?.kind === "node" ? model.getNode(selection.id) : undefined;
  nodeValueControl.hidden = !node;
  if (node && document.activeElement !== nodeValueInput) nodeValueInput.value = node.value;
  const edge = selection?.kind === "edge" ? model.getEdge(selection.id) : undefined;
  capacityControl.hidden = !edge;
  if (edge && document.activeElement !== capacityInput) capacityInput.value = String(edge.capacity);
}

function scheduleDraw() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    drawFlowCanvas(canvas, model, selection, firstNode, { source: sourceId, sink: sinkId }, result);
  });
}

function recalculate() {
  result = sourceId && sinkId ? model.getMaxFlow(sourceId, sinkId) : null;
  flowResult.hidden = !result;
  if (result) {
    const value = displayNumber(result.value);
    maxFlowValue.textContent = value;
    flowResult.setAttribute("aria-label", `Flusso massimo: ${value}`);
  }
  scheduleDraw();
}

function resize() { resizeFlowCanvas(canvas); scheduleDraw(); }
function setTool(next: Tool) { tool = next; firstNode = null; syncControls(); scheduleDraw(); }

function addNode(x: number, y: number) {
  const node = model.addNode(x, y);
  selection = { kind: "node", id: node.id };
  model.save();
  setTool("select");
  nodeValueInput.focus({ preventScroll: true });
}

function connect(id: string) {
  if (!firstNode) {
    firstNode = id;
    selection = { kind: "node", id };
  } else if (firstNode !== id) {
    const { edge, created } = model.connectNodes(firstNode, id);
    if (created) { model.save(); recalculate(); }
    selection = { kind: "edge", id: edge.id };
    setTool("select");
  } else {
    firstNode = null;
  }
  syncControls();
  scheduleDraw();
}

function closeContextMenu() { contextMenu.hidden = true; contextNodeId = null; }

function setEndpoint(which: "source" | "sink") {
  if (!contextNodeId) return;
  if (which === "source") {
    sourceId = sourceId === contextNodeId ? null : contextNodeId;
    if (sourceId === sinkId) sinkId = null;
  } else {
    sinkId = sinkId === contextNodeId ? null : contextNodeId;
    if (sinkId === sourceId) sourceId = null;
  }
  closeContextMenu();
  canvas.focus({ preventScroll: true });
  recalculate();
}

function removeSelection() {
  if (!selection) return;
  if (selection.kind === "node") {
    if (sourceId === selection.id) sourceId = null;
    if (sinkId === selection.id) sinkId = null;
  }
  model.removeSelection(selection);
  selection = null;
  firstNode = null;
  closeContextMenu();
  model.save();
  syncControls();
  recalculate();
}

selectButton.onclick = () => setTool("select");
nodeButton.onclick = () => setTool("node");
edgeButton.onclick = () => setTool("edge");
deleteButton.onclick = removeSelection;
sourceButton.onclick = () => setEndpoint("source");
sinkButton.onclick = () => setEndpoint("sink");
nodeValueInput.oninput = () => {
  if (selection?.kind !== "node") return;
  model.setNodeValue(selection.id, nodeValueInput.value);
  model.save();
  scheduleDraw();
};
nodeValueInput.onkeydown = event => { if (event.key === "Enter") nodeValueInput.blur(); };
capacityInput.onchange = () => {
  const edge = selection?.kind === "edge" ? model.getEdge(selection.id) : undefined;
  if (!edge) return;
  const capacity = Number(capacityInput.value);
  if (capacityInput.value.trim() && Number.isFinite(capacity) && capacity >= 0) {
    model.setCapacity(edge.id, capacity);
    model.save();
    recalculate();
  } else {
    capacityInput.value = String(edge.capacity);
  }
};
capacityInput.onkeydown = event => { if (event.key === "Enter") capacityInput.blur(); };

canvas.addEventListener("contextmenu", event => {
  const { x, y } = point(event);
  const node = hitFlowNode(model, x, y);
  if (!node) { closeContextMenu(); return; }
  event.preventDefault();
  contextNodeId = node.id;
  selection = { kind: "node", id: node.id };
  firstNode = null;
  syncControls();
  scheduleDraw();
  sourceButton.classList.toggle("active", sourceId === node.id);
  sinkButton.classList.toggle("active", sinkId === node.id);
  sourceButton.setAttribute("aria-label", sourceId === node.id ? "Rimuovi sorgente" : "Imposta come sorgente");
  sinkButton.setAttribute("aria-label", sinkId === node.id ? "Rimuovi pozzo" : "Imposta come pozzo");
  contextMenu.hidden = false;
  const margin = 8;
  contextMenu.style.left = `${Math.max(margin, Math.min(event.clientX, window.innerWidth - contextMenu.offsetWidth - margin))}px`;
  contextMenu.style.top = `${Math.max(margin, Math.min(event.clientY, window.innerHeight - contextMenu.offsetHeight - margin))}px`;
  sourceButton.focus({ preventScroll: true });
});

document.addEventListener("pointerdown", event => {
  if (!contextMenu.hidden && !contextMenu.contains(event.target as Node)) closeContextMenu();
});

canvas.addEventListener("pointerdown", event => {
  if (event.button !== 0) return;
  const { x, y } = point(event);
  const node = hitFlowNode(model, x, y);
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
    const edge = hitFlowEdge(model, x, y);
    selection = edge ? { kind: "edge", id: edge.id } : null;
  }
  syncControls();
  scheduleDraw();
});

canvas.addEventListener("pointermove", event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const node = model.getNode(drag.id);
  if (!node) return;
  const { x, y } = point(event);
  const nextX = Math.max(flowNodeRadius, Math.min(canvas.clientWidth - flowNodeRadius, x + drag.offsetX));
  const nextY = Math.max(flowNodeRadius, Math.min(canvas.clientHeight - flowNodeRadius, y + drag.offsetY));
  if (Math.hypot(nextX - node.x, nextY - node.y) < .1) return;
  model.moveNode(node.id, nextX, nextY);
  drag.moved = true;
  canvas.classList.add("dragging");
  scheduleDraw();
});

canvas.addEventListener("pointerup", event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  if (drag.moved) model.save();
  drag = null;
  canvas.classList.remove("dragging");
});

canvas.addEventListener("pointercancel", event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const node = model.getNode(drag.id);
  if (node) model.moveNode(node.id, drag.x, drag.y);
  drag = null;
  canvas.classList.remove("dragging");
  scheduleDraw();
});

canvas.addEventListener("dblclick", event => {
  if (tool !== "select") return;
  const { x, y } = point(event);
  const node = hitFlowNode(model, x, y);
  if (node) {
    selection = { kind: "node", id: node.id };
    syncControls();
    scheduleDraw();
    nodeValueInput.focus({ preventScroll: true });
    nodeValueInput.select();
  } else if (!hitFlowEdge(model, x, y)) addNode(x, y);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !contextMenu.hidden) {
    closeContextMenu();
    canvas.focus({ preventScroll: true });
    return;
  }
  if (event.target instanceof HTMLInputElement) return;
  if (event.key === "Delete" || event.key === "Backspace") {
    if (selection) { event.preventDefault(); removeSelection(); }
  } else if (event.key === "Escape") setTool("select");
});

new ResizeObserver(resize).observe(canvas);
window.addEventListener("resize", () => { resize(); closeContextMenu(); });
window.addEventListener("scroll", closeContextMenu, true);
syncControls();
resize();
