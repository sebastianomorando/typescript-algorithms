import { arrange, clone, colors, descendants, example, History, parseTree, removeNode, reparent } from "./tree";
import type { Color, Tree, TreeNode } from "./tree";

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
const canvas = document.getElementById("canvas")! as unknown as SVGSVGElement;
const viewport = document.getElementById("viewport")!;
const svgNS = "http://www.w3.org/2000/svg";
const storageKey = "tree-lab-v1";
const history = new History();
let tree: Tree = example();
let selected: string | null = "b";
let connecting = false;
let zoom = 1;
let pan = { x: 0, y: 0 };
let toastTimer: ReturnType<typeof setTimeout>;
let storageAvailable = true;
try {
  const saved = localStorage.getItem(storageKey);
  if (saved !== null) { tree = parseTree(JSON.parse(saved)); selected = null; }
} catch { storageAvailable = false; }

function notify(message: string) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $("toast").hidden = true; }, 4000);
}

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(tree)); storageAvailable = true; }
  catch { storageAvailable = false; }
  $("save-status").textContent = storageAvailable ? "Salvato in questo browser" : "Salvataggio non disponibile · esporta l’albero";
}

function commit(next: Tree, label: string, before: Tree = tree) {
  history.commit(before, next, label);
  tree = next;
  if (!tree.some(node => node.id === selected)) selected = null;
  save();
  render();
}

function svgElement(name: string, attrs: Record<string, string | number>) {
  const element = document.createElementNS(svgNS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function draw() {
  const edges = document.createDocumentFragment();
  const nodes = document.getElementById("nodes")!;
  const existing = new Map(Array.from(nodes.children).map(element => [element.getAttribute("data-id"), element]));
  for (const node of tree) {
    const parent = tree.find(candidate => candidate.id === node.parent);
    if (parent) {
      const dx = node.x - parent.x, dy = node.y - parent.y;
      const distance = Math.hypot(dx, dy) || 1;
      const offset = Math.min(29, distance / 2);
      edges.append(svgElement("line", { x1: parent.x + dx / distance * offset, y1: parent.y + dy / distance * offset,
        x2: node.x - dx / distance * offset, y2: node.y - dy / distance * offset, class: "edge" }));
    }
    let group = existing.get(node.id);
    if (!group) {
      group = svgElement("g", { "data-id": node.id, tabindex: "0", role: "button" });
      group.append(svgElement("title", {}), svgElement("circle", { r: 37, class: "node-halo" }),
        svgElement("circle", { r: 29, class: "node-disc" }), svgElement("text", { class: "node-text" }),
        svgElement("text", { y: -47, class: "node-root-label" }));
      nodes.append(group);
    }
    existing.delete(node.id);
    group.setAttribute("transform", `translate(${node.x} ${node.y})`);
    group.setAttribute("class", `tree-node${selected === node.id ? " selected" : ""}`);
    group.setAttribute("aria-label", `Nodo ${node.value || "senza valore"}, ${colors[node.color].label}${node.parent === null ? ", radice" : ""}`);
    group.setAttribute("aria-pressed", String(selected === node.id));
    group.querySelector("title")!.textContent = `${node.value || "Senza valore"} · ${colors[node.color].label}`;
    group.querySelector(".node-disc")!.setAttribute("fill", colors[node.color].fill);
    const text = group.querySelector<SVGTextElement>(".node-text")!;
    text.textContent = node.value.length > 6 ? `${node.value.slice(0, 5)}…` : node.value || "·";
    text.style.fontSize = node.value.length > 3 ? "12px" : "16px";
    group.querySelector(".node-root-label")!.textContent = node.parent === null ? "RADICE" : "";
  }
  existing.forEach(element => element.remove());
  document.getElementById("edges")!.replaceChildren(edges);
  $("node-count").textContent = `${tree.length} ${tree.length === 1 ? "nodo" : "nodi"}`;
  $("empty-state").hidden = tree.length !== 0;
  transform();
}

function inspector() {
  const node = tree.find(candidate => candidate.id === selected);
  $("selection").hidden = !node;
  $("no-selection").hidden = !!node;
  if (!node) return;
  $("node-preview").textContent = node.value.length > 5 ? `${node.value.slice(0, 4)}…` : node.value || "·";
  $("node-preview").style.background = colors[node.color].fill;
  $("selected-title").textContent = `Nodo ${node.value || "senza valore"}`;
  const children = tree.filter(candidate => candidate.parent === node.id).length;
  $("node-kind").textContent = `${node.parent === null ? "Radice" : "Nodo"} · ${children} ${children === 1 ? "figlio" : "figli"}`;
  $<HTMLInputElement>("node-value").value = node.value;
  document.querySelectorAll<HTMLButtonElement>("[data-color]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.color === node.color)));
  const select = $<HTMLSelectElement>("node-parent");
  const excluded = descendants(tree, node.id);
  select.replaceChildren(new Option("Nessuno · radice indipendente", ""));
  tree.filter(candidate => !excluded.has(candidate.id)).forEach((candidate) => {
    select.add(new Option(`Nodo ${candidate.value || "senza valore"} (${tree.indexOf(candidate) + 1})`, candidate.id));
  });
  select.value = node.parent ?? "";
  $<HTMLButtonElement>("detach").disabled = node.parent === null;
  $<HTMLButtonElement>("delete-subtree").disabled = children === 0;
}

function render() {
  draw();
  inspector();
  $<HTMLButtonElement>("undo").disabled = !history.canUndo;
  $<HTMLButtonElement>("redo").disabled = !history.canRedo;
  $("step-count").textContent = `Passo ${history.count}`;
  $("step-label").textContent = history.label;
  $("mode-banner").hidden = !connecting;
  canvas.classList.toggle("connecting", connecting);
}

function transform() {
  viewport.setAttribute("transform", `translate(${pan.x} ${pan.y}) scale(${zoom})`);
  $("zoom-label").textContent = `${Math.round(zoom * 100)}%`;
}

function fit() {
  const { width, height } = canvas.getBoundingClientRect();
  if (!tree.length) { zoom = 1; pan = { x: width / 2, y: height / 2 }; transform(); return; }
  const minX = Math.min(...tree.map(node => node.x)) - 60;
  const maxX = Math.max(...tree.map(node => node.x)) + 60;
  const minY = Math.min(...tree.map(node => node.y)) - 70;
  const maxY = Math.max(...tree.map(node => node.y)) + 60;
  zoom = Math.max(.1, Math.min(1.15, (width - 75) / (maxX - minX), (height - 145) / (maxY - minY)));
  pan = { x: width / 2 - (minX + maxX) / 2 * zoom, y: height / 2 - (minY + maxY) / 2 * zoom };
  transform();
}

function changeZoom(factor: number, x?: number, y?: number) {
  const rect = canvas.getBoundingClientRect();
  x ??= rect.width / 2;
  y ??= rect.height / 2;
  const next = Math.max(.1, Math.min(3, zoom * factor));
  pan = { x: x - (x - pan.x) * next / zoom, y: y - (y - pan.y) * next / zoom };
  zoom = next;
  transform();
}

function addNode(parent: TreeNode | null = null, direction = 1, position?: { x: number; y: number }) {
  if (tree.length >= 500) { notify("Hai raggiunto il limite di 500 nodi."); return; }
  const rect = canvas.getBoundingClientRect();
  let x = position?.x ?? (parent ? parent.x + direction * 90 : (rect.width / 2 - pan.x) / zoom);
  const y = position?.y ?? (parent ? parent.y + 130 : (rect.height / 2 - pan.y) / zoom);
  while (tree.some(node => Math.hypot(node.x - x, node.y - y) < 65)) x += direction * 80;
  const node: TreeNode = { id: crypto.randomUUID(), value: String(tree.length + 1), color: "black", parent: parent?.id ?? null, x, y };
  selected = node.id;
  connecting = false;
  commit([...clone(tree), node], parent ? `Aggiunto figlio di ${parent.value}` : "Aggiunto nodo indipendente");
  $<HTMLInputElement>("node-value").focus({ preventScroll: true });
  $<HTMLInputElement>("node-value").select();
}

function setParent(parent: string | null) {
  if (!selected) return;
  try {
    const next = reparent(tree, selected, parent);
    connecting = false;
    commit(next, parent === null ? "Scollegato sottoalbero" : "Modificato collegamento");
  } catch (error) { notify((error as Error).message); }
}

function selectNode(id: string) {
  if (connecting) { setParent(id); return; }
  selected = id;
  render();
}

function remove(subtree = false) {
  if (!selected) return;
  connecting = false;
  commit(removeNode(tree, selected, subtree), subtree ? "Eliminato sottoalbero" : "Eliminato nodo · figli scollegati");
}

function travel(forward = false) {
  connecting = false;
  tree = forward ? history.redo(tree) : history.undo(tree);
  if (!tree.some(node => node.id === selected)) selected = null;
  save(); render();
}

for (const [color, info] of Object.entries(colors)) {
  const button = document.createElement("button");
  button.className = "color-swatch";
  button.dataset.color = color;
  button.style.background = info.fill;
  button.title = info.label;
  button.setAttribute("aria-label", info.label);
  button.onclick = () => {
    if (selected) commit(tree.map(node => node.id === selected ? { ...node, color: color as Color } : { ...node }), `Colore → ${info.label.toLowerCase()}`);
  };
  $("color-options").append(button);
}

$("add").onclick = () => addNode();
$("empty-add").onclick = () => addNode();
$("add-left").onclick = () => addNode(tree.find(node => node.id === selected) ?? null, -1);
$("add-right").onclick = () => addNode(tree.find(node => node.id === selected) ?? null, 1);
$("undo").onclick = () => travel();
$("redo").onclick = () => travel(true);
$("delete").onclick = () => remove();
$("delete-subtree").onclick = () => remove(true);
$("detach").onclick = () => setParent(null);
$("connect").onclick = () => { connecting = !connecting; render(); };
$("cancel-connect").onclick = () => { connecting = false; render(); };
$("arrange").onclick = () => { commit(arrange(tree), "Riordinate le posizioni"); fit(); };
$("fit").onclick = fit;
$("zoom-in").onclick = () => changeZoom(1.2);
$("zoom-out").onclick = () => changeZoom(1 / 1.2);
$("clear").onclick = () => { connecting = false; commit([], "Svuotata la tela"); fit(); };
$("example").onclick = () => { connecting = false; selected = "b"; commit(example(), "Caricato albero di esempio"); fit(); };
$<HTMLSelectElement>("node-parent").onchange = event => setParent((event.target as HTMLSelectElement).value || null);
$<HTMLInputElement>("node-value").onchange = event => {
  if (!selected) return;
  const value = (event.target as HTMLInputElement).value;
  commit(tree.map(node => node.id === selected ? { ...node, value } : { ...node }), `Valore → ${value || "vuoto"}`);
};
$("node-value").onkeydown = event => { if (event.key === "Enter") (event.target as HTMLInputElement).blur(); };

type Gesture = { pointer: number; capture: Element; id: string | null; x: number; y: number; before: Tree; pan: typeof pan; moved: boolean; subtree: boolean };
let gesture: Gesture | null = null;
canvas.addEventListener("pointerdown", event => {
  if (event.button !== 0 || gesture) return;
  const target = (event.target as Element).closest<SVGGElement>("[data-id]");
  const id = target?.dataset.id ?? null;
  if (connecting && id) { selectNode(id); return; }
  if (connecting) { connecting = false; render(); return; }
  selected = id;
  const capture = target ?? canvas;
  gesture = { pointer: event.pointerId, capture, id, x: event.clientX, y: event.clientY, before: clone(tree), pan: { ...pan }, moved: false, subtree: event.shiftKey };
  capture.setPointerCapture(event.pointerId);
  canvas.classList.add("panning");
  render();
});
canvas.addEventListener("pointermove", event => {
  if (!gesture || gesture.pointer !== event.pointerId) return;
  const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
  if (!gesture.moved && Math.hypot(dx, dy) < 4) return;
  gesture.moved = true;
  if (gesture.id) {
    const ids = gesture.subtree ? descendants(gesture.before, gesture.id) : new Set([gesture.id]);
    tree = gesture.before.map(node => ids.has(node.id) ? { ...node, x: node.x + dx / zoom, y: node.y + dy / zoom } : { ...node });
    draw();
  } else { pan = { x: gesture.pan.x + dx, y: gesture.pan.y + dy }; transform(); }
});
function endGesture(cancel = false) {
  const current = gesture;
  if (!current) return;
  gesture = null;
  if (current.capture.hasPointerCapture(current.pointer)) current.capture.releasePointerCapture(current.pointer);
  canvas.classList.remove("panning");
  if (cancel) { tree = current.before; pan = current.pan; render(); }
  else if (current.id && current.moved) commit(tree, current.subtree ? "Spostato sottoalbero" : "Spostato nodo", current.before);
}
canvas.addEventListener("pointerup", () => endGesture());
canvas.addEventListener("pointercancel", () => endGesture(true));
canvas.addEventListener("lostpointercapture", () => endGesture(true));
canvas.addEventListener("wheel", event => {
  event.preventDefault();
  if (gesture) return;
  const rect = canvas.getBoundingClientRect();
  changeZoom(Math.exp(-event.deltaY * .0015), event.clientX - rect.left, event.clientY - rect.top);
}, { passive: false });
canvas.addEventListener("dblclick", event => {
  const target = (event.target as Element).closest<SVGGElement>("[data-id]");
  if (target) { selected = target.dataset.id!; render(); $<HTMLInputElement>("node-value").focus(); $<HTMLInputElement>("node-value").select(); }
  else {
    const rect = canvas.getBoundingClientRect();
    addNode(null, 1, { x: (event.clientX - rect.left - pan.x) / zoom, y: (event.clientY - rect.top - pan.y) / zoom });
  }
});
canvas.addEventListener("keydown", event => {
  const target = (event.target as Element).closest<SVGGElement>("[data-id]");
  if (target && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    selectNode(target.dataset.id!);
    canvas.querySelector<SVGGElement>(`[data-id="${CSS.escape(target.dataset.id!)}"]`)?.focus();
  }
});
document.addEventListener("keydown", event => {
  if ((event.target as Element).closest("input,select,textarea,[contenteditable=true]")) return;
  if (event.key === "Escape") { endGesture(true); connecting = false; render(); }
  if (gesture) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") { event.preventDefault(); travel(event.shiftKey); }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") { event.preventDefault(); travel(true); }
  if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); remove(); }
});

$("export").onclick = () => {
  const blob = new Blob([JSON.stringify(tree, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "tree-lab.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Albero esportato.");
};
$("import").onclick = () => $<HTMLInputElement>("import-file").click();
$<HTMLInputElement>("import-file").onchange = async event => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 1_000_000) throw new Error("Il file è troppo grande (massimo 1 MB).");
    const next = parseTree(JSON.parse(await file.text()));
    connecting = false;
    selected = null;
    commit(next, "Importato albero"); fit();
    notify("Albero importato. Puoi annullare per tornare al precedente.");
  } catch (error) { notify(error instanceof SyntaxError ? "Il file non è un JSON valido." : (error as Error).message); }
  finally { input.value = ""; }
};

$("canvas-wrap").title = "Trascina per spostare un nodo. Shift + trascina per spostare anche i discendenti. Doppio clic sullo sfondo per aggiungere un nodo.";
render();
fit();
new ResizeObserver(() => { if (!gesture) fit(); }).observe($("canvas-wrap"));
if (!storageAvailable) {
  $("save-status").textContent = "Salvataggio non disponibile · esporta l’albero";
  notify("Impossibile ripristinare il salvataggio locale. Puoi usare Importa ed Esporta.");
}
