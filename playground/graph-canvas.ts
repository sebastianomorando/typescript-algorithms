import type { GraphEdge, GraphModel, GraphNode, GraphSelection } from "./graph-model";

export const nodeRadius = 24;

type Route = { start: string | null; end: string | null; path: readonly GraphNode[] | null };

export function drawGraph(canvas: HTMLCanvasElement, graph: GraphModel, selection: GraphSelection, firstNode: string | null, route: Route) {
  const context = canvas.getContext("2d")!;
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  const pathEdges = new Set<string>();
  const pathNodes = new Set(route.path?.map(node => node.id));
  if (route.path) {
    for (let index = 1; index < route.path.length; index++) {
      const from = route.path[index - 1];
      const to = route.path[index];
      const edge = graph.neighbors(from.id).find(neighbor => neighbor.node.id === to.id)?.edge;
      if (edge) pathEdges.add(edge.id);
    }
  }

  for (const edge of graph.edges) {
    const from = graph.getNode(edge.from);
    const to = graph.getNode(edge.to);
    if (!from || !to) continue;
    const selected = selection?.kind === "edge" && selection.id === edge.id;
    const onPath = pathEdges.has(edge.id);
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.strokeStyle = onPath ? "#ca7540" : selected ? "#397653" : "#98ac92";
    context.lineWidth = onPath ? 5 : selected ? 3 : 2;
    context.stroke();

    const value = String(graph.edgeWeight(edge));
    const x = (from.x + to.x) / 2;
    const y = (from.y + to.y) / 2;
    context.font = "600 12px 'DM Sans', sans-serif";
    const labelWidth = Math.max(26, context.measureText(value).width + 16);
    context.fillStyle = onPath ? "#ca7540" : selected ? "#397653" : "#ffffff";
    context.strokeStyle = onPath ? "#ca7540" : selected ? "#397653" : "#dce5d8";
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(x - labelWidth / 2, y - 12, labelWidth, 24, 7);
    context.fill();
    context.stroke();
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = onPath || selected ? "#ffffff" : "#52684e";
    context.fillText(value, x, y + .5);
  }

  for (const node of graph.nodes) {
    const selected = selection?.kind === "node" && selection.id === node.id;
    const pending = firstNode === node.id;
    const start = route.start === node.id;
    const end = route.end === node.id;
    const onPath = pathNodes.has(node.id);
    if (selected || pending || start || end || onPath) {
      context.beginPath();
      context.arc(node.x, node.y, nodeRadius + 7, 0, Math.PI * 2);
      context.strokeStyle = start ? "#357a9e" : end ? "#b96d42" : onPath ? "#ca7540" : "#7a9b6b";
      context.lineWidth = start || end || onPath ? 3 : 2;
      context.setLineDash(pending && !start && !end && !onPath ? [4, 4] : []);
      context.stroke();
      context.setLineDash([]);
    }
    context.beginPath();
    context.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    context.fillStyle = "#397653";
    context.fill();
    context.strokeStyle = "#ffffff";
    context.lineWidth = 3;
    context.stroke();
    if (node.value) {
      context.font = "600 13px 'DM Sans', sans-serif";
      const maxWidth = nodeRadius * 2 - 12;
      let label = node.value;
      if (context.measureText(label).width > maxWidth) {
        label = "";
        for (const character of node.value) {
          if (context.measureText(label + character + "…").width > maxWidth) break;
          label += character;
        }
        label += "…";
      }
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#ffffff";
      context.fillText(label, node.x, node.y + .5);
    }
  }
}

export function resizeGraphCanvas(canvas: HTMLCanvasElement) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * ratio);
  canvas.height = Math.round(canvas.clientHeight * ratio);
  canvas.getContext("2d")!.setTransform(ratio, 0, 0, ratio, 0, 0);
}

export function hitNode(graph: GraphModel, x: number, y: number): GraphNode | undefined {
  return [...graph.nodes].reverse().find(node => Math.hypot(node.x - x, node.y - y) <= nodeRadius + 5);
}

export function hitEdge(graph: GraphModel, x: number, y: number): GraphEdge | undefined {
  let nearest: GraphEdge | undefined;
  let nearestDistance = 10;
  for (const edge of graph.edges) {
    const from = graph.getNode(edge.from)!;
    const to = graph.getNode(edge.to)!;
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
