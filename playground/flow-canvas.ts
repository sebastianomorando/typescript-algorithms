import type { FlowEdge, FlowModel, FlowNode, FlowSelection, MaxFlowResult } from "./flow-model";

export const flowNodeRadius = 24;
type Endpoints = { source: string | null; sink: string | null };
type EdgeGeometry = { x1: number; y1: number; x2: number; y2: number; nx: number; ny: number; labelX: number; labelY: number };

function geometry(model: FlowModel, edge: FlowEdge): EdgeGeometry {
  const from = model.getNode(edge.from)!;
  const to = model.getNode(edge.to)!;
  const distance = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const ux = (to.x - from.x) / distance;
  const uy = (to.y - from.y) / distance;
  const nx = -uy;
  const ny = ux;
  const offset = model.getEdgeBetween(edge.to, edge.from) ? 10 : 0;
  const trim = Math.min(flowNodeRadius + 2, Math.max(0, distance / 2 - 6));
  const x1 = from.x + ux * trim + nx * offset;
  const y1 = from.y + uy * trim + ny * offset;
  const x2 = to.x - ux * trim + nx * offset;
  const y2 = to.y - uy * trim + ny * offset;
  return { x1, y1, x2, y2, nx, ny, labelX: (x1 + x2) / 2 + nx * 14, labelY: (y1 + y2) / 2 + ny * 14 };
}

function displayNumber(value: number): string { return Number.isFinite(value) ? String(Number(value.toPrecision(6))) : String(value); }

export function drawFlowCanvas(canvas: HTMLCanvasElement, model: FlowModel, selection: FlowSelection,
  pendingNode: string | null, endpoints: Endpoints, result: MaxFlowResult | null) {
  const context = canvas.getContext("2d")!;
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  for (const edge of model.edges) {
    const { x1, y1, x2, y2, nx, ny, labelX, labelY } = geometry(model, edge);
    const flow = result?.flows.get(edge.id) ?? 0;
    const used = result !== null && flow > 1e-9;
    const selected = selection?.kind === "edge" && selection.id === edge.id;
    const color = used ? "#267f96" : selected ? "#397653" : "#8ea9ab";
    const dx = x2 - x1, dy = y2 - y1;
    const distance = Math.hypot(dx, dy) || 1;
    const ux = dx / distance, uy = dy / distance;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = used ? 3.5 : selected ? 3 : 2;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.beginPath();
    context.moveTo(x2, y2);
    context.lineTo(x2 - ux * 10 + nx * 5, y2 - uy * 10 + ny * 5);
    context.lineTo(x2 - ux * 10 - nx * 5, y2 - uy * 10 - ny * 5);
    context.closePath();
    context.fill();

    const label = result ? `${displayNumber(flow)}/${displayNumber(edge.capacity)}` : displayNumber(edge.capacity);
    context.font = "600 12px 'DM Sans', sans-serif";
    const width = Math.max(26, context.measureText(label).width + 16);
    context.beginPath();
    context.roundRect(labelX - width / 2, labelY - 12, width, 24, 7);
    context.fillStyle = used ? "#267f96" : selected ? "#397653" : "#ffffff";
    context.strokeStyle = used ? "#267f96" : selected ? "#397653" : "#dce5e2";
    context.lineWidth = 1;
    context.fill();
    context.stroke();
    context.fillStyle = used || selected ? "#ffffff" : "#4e6769";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, labelX, labelY + .5);
  }

  for (const node of model.nodes) {
    const source = endpoints.source === node.id;
    const sink = endpoints.sink === node.id;
    const selected = selection?.kind === "node" && selection.id === node.id;
    const pending = pendingNode === node.id;
    if (source || sink || selected || pending) {
      context.beginPath();
      context.arc(node.x, node.y, flowNodeRadius + 7, 0, Math.PI * 2);
      context.strokeStyle = source ? "#267796" : sink ? "#c06c37" : "#7a9b8e";
      context.lineWidth = source || sink ? 3 : 2;
      context.setLineDash(pending && !source && !sink ? [4, 4] : []);
      context.stroke();
      context.setLineDash([]);
    }
    context.beginPath();
    context.arc(node.x, node.y, flowNodeRadius, 0, Math.PI * 2);
    context.fillStyle = "#346f7e";
    context.fill();
    context.strokeStyle = "#ffffff";
    context.lineWidth = 3;
    context.stroke();
    if (node.value) {
      context.font = "600 13px 'DM Sans', sans-serif";
      const maxWidth = flowNodeRadius * 2 - 12;
      let label = node.value;
      if (context.measureText(label).width > maxWidth) {
        label = "";
        for (const character of node.value) {
          if (context.measureText(label + character + "…").width > maxWidth) break;
          label += character;
        }
        label += "…";
      }
      context.fillStyle = "#ffffff";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(label, node.x, node.y + .5);
    }
  }
}

export function resizeFlowCanvas(canvas: HTMLCanvasElement) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * ratio);
  canvas.height = Math.round(canvas.clientHeight * ratio);
  canvas.getContext("2d")!.setTransform(ratio, 0, 0, ratio, 0, 0);
}

export function hitFlowNode(model: FlowModel, x: number, y: number): FlowNode | undefined {
  return [...model.nodes].reverse().find(node => Math.hypot(node.x - x, node.y - y) <= flowNodeRadius + 5);
}

export function hitFlowEdge(model: FlowModel, x: number, y: number): FlowEdge | undefined {
  let nearest: FlowEdge | undefined;
  let nearestDistance = 12;
  for (const edge of model.edges) {
    const { x1, y1, x2, y2, labelX, labelY } = geometry(model, edge);
    const dx = x2 - x1, dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    if (!lengthSquared) continue;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
    const distance = Math.min(Math.hypot(x - x1 - t * dx, y - y1 - t * dy),
      Math.abs(x - labelX) < 34 && Math.abs(y - labelY) < 12 ? 0 : Infinity);
    if (distance < nearestDistance) { nearest = edge; nearestDistance = distance; }
  }
  return nearest;
}
